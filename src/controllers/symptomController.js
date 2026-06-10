import { listSymptoms, searchBySymptom } from "../services/symptomService.js";

const getSymptoms = async (_req, res, next) => {
  try {
    res.status(200).json(listSymptoms());
  } catch (error) {
    next(error);
  }
};

const searchSymptoms = async (req, res, next) => {
  try {
    const q = req.query.q || req.query.symptom;
    if (!q) return res.status(400).json({ message: "Query parameter q is required" });
    const data = await searchBySymptom(q, { limit: Number(req.query.limit) || 20 });
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export { getSymptoms, searchSymptoms };
