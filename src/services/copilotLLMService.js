import { fuzzySearchProducts } from "./symptomService.js";

const SYSTEM_PROMPT = `Você é o Copilot Umbrella, assistente farmacêutico de um marketplace.
Responda em português do Brasil, de forma clara e empática.
Não prescreva medicamentos controlados sem receita. Não substitua orientação médica.
Se o usuário descrever sintomas, sugira tipos de medicamentos e recomende buscar um profissional quando necessário.
Seja conciso (máximo 4 frases).`;

const chatWithLLM = async ({ message, products = [] }) => {
  const productContext = products.length
    ? `Produtos encontrados no catálogo: ${products.map((p) => p.name).join(", ")}.`
    : "Nenhum produto encontrado ainda no catálogo para esta busca.";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 400,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: productContext },
        { role: "user", content: message }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`LLM chat failed: ${err.slice(0, 200)}`);
  }

  const json = await response.json();
  const reply = json.choices?.[0]?.message?.content?.trim() || "Não consegui elaborar uma resposta agora.";

  let enrichedProducts = products;
  if (!enrichedProducts.length) {
    const searchTerms = extractSearchTerms(message);
    for (const term of searchTerms) {
      const found = await fuzzySearchProducts(term, { limit: 2 });
      for (const product of found) {
        if (!enrichedProducts.some((item) => item.id === product.id)) {
          enrichedProducts.push(product);
        }
      }
    }
    enrichedProducts = enrichedProducts.slice(0, 6);
  }

  return { reply, products: enrichedProducts };
};

const extractSearchTerms = (message) => {
  const cleaned = message
    .replace(/[^\w\sáàâãéêíóôõúç/-]/gi, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 4);

  const terms = [];
  if (cleaned.length >= 2) {
    terms.push(cleaned.slice(0, 3).join(" "));
  }
  terms.push(...cleaned.filter((word) => word.length >= 5).slice(0, 2));
  return [...new Set(terms)].slice(0, 3);
};

export { chatWithLLM };
