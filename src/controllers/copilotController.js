import { chat, scanPrescription } from "../services/copilotService.js";

const postChat = async (req, res, next) => {
  try {
    const data = await chat({
      userId: req.user?.id,
      message: req.body.message
    });
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const postPrescriptionScan = async (req, res, next) => {
  try {
    const data = await scanPrescription({
      userId: req.user?.id,
      text: req.body.text,
      fileData: req.body.file_data
    });
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export { postChat, postPrescriptionScan };
