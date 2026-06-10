import sdb from "./database.js";
import { searchBySymptom, fuzzySearchProducts } from "./symptomService.js";
import { SYMPTOM_MAP } from "../data/symptomMap.js";

const DISCLAIMER = "Sou um assistente informativo. Não substituo orientação médica ou farmacêutica.";

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

const chat = async ({ userId, message }) => {
  const trimmed = message?.trim();
  if (!trimmed) throw new Error("Message is required");

  const symptom = detectSymptomIntent(trimmed);
  if (symptom) {
    const { results, terms } = await searchBySymptom(symptom, { limit: 6 });
    const reply = results.length
      ? `Encontrei ${results.length} opção(ões) relacionadas a "${SYMPTOM_MAP[symptom].label}". Confira os produtos sugeridos abaixo.`
      : `Não encontrei produtos para "${SYMPTOM_MAP[symptom].label}" no momento. Tente outro termo ou fale com um farmacêutico.`;

    await logCopilot({ userId, intent: "symptom_search", inputText: trimmed, responseSummary: reply });

    return {
      reply: `${reply}\n\n${DISCLAIMER}`,
      intent: "symptom_search",
      symptom,
      terms,
      products: results
    };
  }

  if (/receita|prescri|medicamento|remédio|remedio/i.test(trimmed)) {
    const reply = "Para ler uma receita, use a opção \"Escanear receita\" e cole o texto ou envie a imagem. Também posso buscar por sintoma, como febre, dor ou gripe.";
    await logCopilot({ userId, intent: "help", inputText: trimmed, responseSummary: reply });
    return { reply: `${reply}\n\n${DISCLAIMER}`, intent: "help", products: [] };
  }

  const products = await fuzzySearchProducts(trimmed, { limit: 6 });
  const reply = products.length
    ? `Aqui estão sugestões para "${trimmed}":`
    : `Não encontrei resultados para "${trimmed}". Tente descrever um sintoma (ex: febre, dor de cabeça) ou o nome do medicamento.`;

  await logCopilot({ userId, intent: "product_search", inputText: trimmed, responseSummary: reply });

  return {
    reply: `${reply}\n\n${DISCLAIMER}`,
    intent: "product_search",
    products
  };
};

const scanPrescription = async ({ userId, text, fileData }) => {
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
        matches.push({ ...product, matched_term: candidate });
      }
    }
  }

  const reply = matches.length
    ? `Identifiquei ${matches.length} medicamento(s) compatíveis na receita. Revise as quantidades com o farmacêutico antes do checkout.`
    : "Não consegui associar os itens da receita a produtos do catálogo. Tente colar o texto com mais clareza ou adicione manualmente.";

  await logCopilot({
    userId,
    intent: "prescription_scan",
    inputText: sourceText,
    responseSummary: `${matches.length} matches`
  });

  return {
    reply: `${reply}\n\n${DISCLAIMER}`,
    parsed_lines: candidates,
    products: matches
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

export { chat, scanPrescription };
