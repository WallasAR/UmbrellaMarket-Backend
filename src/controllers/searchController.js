import { getSuggestions, saveSearchHistory, getSearchHistory } from "../services/searchService.js";

const suggestions = async (req, res, next) => {
  try {
    const q = req.query.q || "";
    const pharmacyId = req.query.pharmacyId;
    const sessionId = req.headers["x-session-id"];
    const userId = req.user?.id; 
    
    const data = await getSuggestions(q, userId, sessionId, pharmacyId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const history = async (req, res, next) => {
  try {
    const sessionId = req.headers["x-session-id"];
    const userId = req.user?.id;
    
    const data = await getSearchHistory(userId, sessionId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const saveHistory = async (req, res, next) => {
  try {
    const sessionId = req.headers["x-session-id"];
    const userId = req.user?.id;
    const term = req.body.term;
    
    await saveSearchHistory(term, userId, sessionId);
    res.status(201).json({ message: "Saved" });
  } catch (error) {
    next(error);
  }
};

export { suggestions, history, saveHistory };
