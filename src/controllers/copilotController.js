import { chat, scanPrescription, prescriptionToCart } from "../services/copilotService.js";
import { listUserSessions, listSessionMessages } from "../services/copilotSessionService.js";

const postChat = async (req, res, next) => {
  try {
    const data = await chat({
      userId: req.user.id,
      message: req.body.message,
      sessionId: req.body.session_id
    });
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const postPrescriptionScan = async (req, res, next) => {
  try {
    const data = await scanPrescription({
      userId: req.user.id,
      text: req.body.text,
      fileData: req.body.file_data,
      sessionId: req.body.session_id
    });
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const postPrescriptionToCart = async (req, res, next) => {
  try {
    const data = await prescriptionToCart({
      userId: req.user.id,
      text: req.body.text,
      fileData: req.body.file_data,
      items: req.body.items
    });
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const getSessions = async (req, res, next) => {
  try {
    const data = await listUserSessions(req.user.id);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const getSessionMessages = async (req, res, next) => {
  try {
    const data = await listSessionMessages(req.params.id, req.user.id);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export {
  postChat,
  postPrescriptionScan,
  postPrescriptionToCart,
  getSessions,
  getSessionMessages
};
