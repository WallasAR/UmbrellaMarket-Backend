import sdb from "./database.js";
import { searchBySymptom, fuzzySearchProducts } from "./symptomService.js";
import { SYMPTOM_MAP } from "../data/symptomMap.js";
import { bulkAddToCart } from "./cartService.js";
import {
  createPendingPrescriptionsForMedicines,
  savePrescriptionListFromScan
} from "./prescriptionService.js";
import {
  getOrCreateSession,
  appendMessage,
  updateSessionTitle
} from "./copilotSessionService.js";
import { chatWithLLM } from "./copilotLLMService.js";

const DISCLAIMER = "Sou um assistente informativo. Não substituo orientação médica ou farmacêutica.";

const buildProductSearchPayload = (query, products) => {
  const reply = products.length
    ? `Aqui estão sugestões para "${query}":`
    : `Não encontrei resultados para "${query}". Tente descrever um sintoma ou o nome do medicamento.`;

  return {
    reply: `${reply}\n\n${DISCLAIMER}`,
    intent: "product_search",
    products
  };
};

const logCopilot = async ({ userId, intent, inputText, responseSummary }) => {
  await sdb.from("CopilotLog").insert({
    user_id: userId || null,
    intent,
    input_text: inputText?.slice(0, 2000) || null,
    response_summary: responseSummary?.slice(0, 500) || null
  });
};

const detectSymptomIntent = (message) => {
  const lower = message.toLowerCase();
  for (const [id, data] of Object.entries(SYMPTOM_MAP)) {
    if (lower.includes(id) || lower.includes(data.label.toLowerCase())) {
      return id;
    }
  }
  return null;
};

const extractMedicineCandidates = (text) => {
  const lines = text.split(/[\n,;]+/).map((line) => line.trim()).filter(Boolean);
  const candidates = [];

  for (const line of lines) {
    const cleaned = line
      .replace(/^\d+[\).\-\s]*/g, "")
      .replace(/\b(mg|ml|cp|comp|caps|uso|oral)\b/gi, "")
      .trim();

    if (cleaned.length >= 3 && cleaned.length <= 80) {
      candidates.push(cleaned);
    }
  }

  return [...new Set(candidates)].slice(0, 15);
};

const persistExchange = async ({ sessionId, userMessage, assistantPayload }) => {
  await appendMessage({ sessionId, role: "user", content: userMessage });
  await appendMessage({
    sessionId,
    role: "assistant",
    content: assistantPayload.reply,
    metadata: {
      intent: assistantPayload.intent,
      products: (assistantPayload.products || []).map((p) => ({
        id: p.id,
        name: p.name,
        matched_term: p.matched_term
      }))
    }
  });
};

const chat = async ({ userId, message, sessionId }) => {
  const trimmed = message?.trim();
  if (!trimmed) throw new Error("Message is required");

  const session = await getOrCreateSession(userId, sessionId);
  if (!sessionId) {
    await updateSessionTitle(session.id, trimmed.slice(0, 60));
  }

  let payload;

  const symptom = detectSymptomIntent(trimmed);
  if (symptom) {
    const { results, terms } = await searchBySymptom(symptom, { limit: 6 });
    const reply = results.length
      ? `Encontrei ${results.length} opção(ões) relacionadas a "${SYMPTOM_MAP[symptom].label}". Confira os produtos sugeridos abaixo.`
      : `Não encontrei produtos para "${SYMPTOM_MAP[symptom].label}" no momento. Tente outro termo ou fale com um farmacêutico.`;

    payload = {
      reply: `${reply}\n\n${DISCLAIMER}`,
      intent: "symptom_search",
      symptom,
      terms,
      products: results
    };

    await logCopilot({ userId, intent: "symptom_search", inputText: trimmed, responseSummary: reply });
  } else if (/receita|prescri|medicamento|remédio|remedio/i.test(trimmed)) {
    const reply = "Para ler uma receita, use \"Escanear receita\" e depois \"Adicionar tudo ao carrinho\". Também posso buscar por sintoma, como febre, dor ou gripe.";
    payload = { reply: `${reply}\n\n${DISCLAIMER}`, intent: "help", products: [] };
    await logCopilot({ userId, intent: "help", inputText: trimmed, responseSummary: reply });
  } else {
    const products = await fuzzySearchProducts(trimmed, { limit: 6 });

    if (process.env.OPENAI_API_KEY) {
      try {
        const llm = await chatWithLLM({ message: trimmed, products });
        payload = {
          reply: `${llm.reply}\n\n${DISCLAIMER}`,
          intent: "llm_chat",
          products: llm.products
        };
        await logCopilot({ userId, intent: "llm_chat", inputText: trimmed, responseSummary: llm.reply.slice(0, 120) });
      } catch (err) {
        console.warn("Copilot LLM fallback:", err.message);
        payload = buildProductSearchPayload(trimmed, products);
        await logCopilot({ userId, intent: "product_search", inputText: trimmed, responseSummary: payload.reply.slice(0, 120) });
      }
    } else {
      payload = buildProductSearchPayload(trimmed, products);
      await logCopilot({ userId, intent: "product_search", inputText: trimmed, responseSummary: payload.reply.slice(0, 120) });
    }
  }

  await persistExchange({ sessionId: session.id, userMessage: trimmed, assistantPayload: payload });

  return { session_id: session.id, ...payload };
};

const matchPrescriptionProducts = async ({ text, fileData }) => {
  let sourceText = text?.trim() || "";

  if (!sourceText && fileData && process.env.OPENAI_API_KEY) {
    sourceText = await extractTextWithOpenAI(fileData);
  }

  if (!sourceText) {
    throw new Error("Informe o texto da receita ou configure OPENAI_API_KEY para OCR de imagem");
  }

  const candidates = extractMedicineCandidates(sourceText);
  const matches = [];

  for (const candidate of candidates) {
    const found = await fuzzySearchProducts(candidate, { limit: 2 });
    for (const product of found) {
      if (!matches.some((item) => item.id === product.id)) {
        matches.push({ ...product, matched_term: candidate, suggested_quantity: 1 });
      }
    }
  }

  return { sourceText, candidates, matches };
};

const scanPrescription = async ({ userId, text, fileData, sessionId }) => {
  const session = await getOrCreateSession(userId, sessionId);
  const { sourceText, candidates, matches } = await matchPrescriptionProducts({ text, fileData });

  const reply = matches.length
    ? `Identifiquei ${matches.length} medicamento(s) na receita. Você pode adicionar todos ao carrinho com um clique.`
    : "Não consegui associar os itens da receita a produtos do catálogo. Tente colar o texto com mais clareza.";

  const payload = {
    reply: `${reply}\n\n${DISCLAIMER}`,
    parsed_lines: candidates,
    products: matches,
    intent: "prescription_scan"
  };

  await persistExchange({
    sessionId: session.id,
    userMessage: "Escanear receita",
    assistantPayload: payload
  });

  await logCopilot({
    userId,
    intent: "prescription_scan",
    inputText: sourceText,
    responseSummary: `${matches.length} matches`
  });

  return { session_id: session.id, ...payload };
};

const prescriptionToCart = async ({ userId, text, fileData, items }) => {
  let cartItems = items;
  let scanMatches = [];

  if (!cartItems?.length) {
    const result = await matchPrescriptionProducts({ text, fileData });
    scanMatches = result.matches;
    cartItems = scanMatches.map((product) => ({
      medicine_id: product.id,
      quantity: product.suggested_quantity || 1
    }));
  }

  if (!cartItems.length) {
    throw new Error("Nenhum item válido para adicionar ao carrinho");
  }

  const cartResult = await bulkAddToCart(userId, cartItems);

  const medicineIds = cartItems.map((item) => item.medicine_id);
  const pendingRx = await createPendingPrescriptionsForMedicines(userId, medicineIds);

  await savePrescriptionListFromScan({
    userId,
    title: "Itens da receita",
    items: cartItems.map((item, index) => ({
      medicine_id: item.medicine_id,
      matched_term: scanMatches[index]?.matched_term,
      quantity: item.quantity
    }))
  }).catch(() => null);

  return {
    message: `${cartResult.added + cartResult.updated} item(ns) adicionado(s) ao carrinho`,
    cart: cartResult,
    items: cartItems,
    pending_prescriptions: pendingRx.length,
    requires_pharmacist_review: pendingRx.length > 0
  };
};

const extractTextWithOpenAI = async (fileData) => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Extraia somente a lista de medicamentos desta receita, um por linha, sem dosagem." },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${fileData}` } }
          ]
        }
      ],
      max_tokens: 500
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OCR failed: ${err}`);
  }

  const json = await response.json();
  return json.choices?.[0]?.message?.content || "";
};

export { chat, scanPrescription, prescriptionToCart };
