const INTERACTION_RULES = [
  {
    ingredients: ["ibuprofeno", "aspirina", "ácido acetilsalicílico"],
    severity: "high",
    message: "Ibuprofeno e AAS podem aumentar o risco de sangramento gastrointestinal quando usados juntos."
  },
  {
    ingredients: ["losartana", "ibuprofeno"],
    severity: "medium",
    message: "Anti-inflamatórios podem reduzir o efeito anti-hipertensivo de losartana."
  },
  {
    ingredients: ["warfarina", "aspirina", "ibuprofeno"],
    severity: "high",
    message: "Combinação aumenta significativamente o risco de sangramento."
  },
  {
    ingredients: ["fluoxetina", "tramadol"],
    severity: "high",
    message: "Risco de síndrome serotoninérgica. Consulte um farmacêutico."
  },
  {
    ingredients: ["metformina", "contraste"],
    severity: "medium",
    message: "Verifique orientação médica sobre uso concomitante."
  }
];

const CROSS_SELL_RULES = [
  {
    trigger: ["amoxicilina", "azitromicina", "ciprofloxacino", "antibiótico"],
    suggestTerms: ["probiótico", "flora intestinal"],
    message: "Antibióticos podem afetar a flora intestinal. Considere um probiótico."
  },
  {
    trigger: ["ibuprofeno", "diclofenaco", "naproxeno"],
    suggestTerms: ["protetor gástrico", "omeprazol"],
    message: "Anti-inflamatórios podem irritar o estômago. Proteção gástrica pode ser indicada."
  },
  {
    trigger: ["loratadina", "desloratadina", "antialérgico"],
    suggestTerms: ["soro fisiológico", "spray nasal"],
    message: "Para alívio nasal, sprays e soluções complementares podem ajudar."
  }
];

const normalizeIngredient = (value = "") =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const containsTerm = (haystack, term) => normalizeIngredient(haystack).includes(normalizeIngredient(term));

export { INTERACTION_RULES, CROSS_SELL_RULES, normalizeIngredient, containsTerm };
