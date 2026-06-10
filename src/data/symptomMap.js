const SYMPTOM_MAP = {
  febre: { label: "Febre", terms: ["febre", "antitérmico", "paracetamol", "dipirona", "ibuprofeno"] },
  dor: { label: "Dor", terms: ["dor", "analgésico", "dipirona", "paracetamol", "ibuprofeno", "novalgina"] },
  gripe: { label: "Gripe e resfriado", terms: ["gripe", "resfriado", "antigripal", "coriza", "tosse"] },
  tosse: { label: "Tosse", terms: ["tosse", "xarope", "antitussígeno", "bromexina"] },
  alergia: { label: "Alergia", terms: ["alergia", "antialérgico", "loratadina", "cetirizina", "histamina"] },
  azia: { label: "Azia e refluxo", terms: ["azia", "refluxo", "omeprazol", "pantoprazol", "antiácido"] },
  nausea: { label: "Náusea", terms: ["náusea", "enjoo", "dimenidrinato", "metoclopramida", "dramin"] },
  diabetes: { label: "Diabetes", terms: ["diabetes", "glicemia", "metformina", "insulina", "glicose"] },
  pressao: { label: "Pressão alta", terms: ["pressão", "hipertensão", "losartana", "captopril", "enalapril"] },
  infeccao: { label: "Infecção", terms: ["infecção", "antibiótico", "amoxicilina", "azitromicina", "antibacteriano"] }
};

const listSymptoms = () =>
  Object.entries(SYMPTOM_MAP).map(([id, data]) => ({ id, label: data.label }));

const resolveSymptomTerms = (query) => {
  const normalized = query.toLowerCase().trim();
  const direct = SYMPTOM_MAP[normalized];
  if (direct) return direct.terms;

  for (const [, data] of Object.entries(SYMPTOM_MAP)) {
    if (data.label.toLowerCase().includes(normalized) || normalized.includes(data.label.toLowerCase())) {
      return data.terms;
    }
  }

  return [normalized];
};

export { SYMPTOM_MAP, listSymptoms, resolveSymptomTerms };
