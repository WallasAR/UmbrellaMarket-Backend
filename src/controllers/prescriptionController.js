import {
  uploadPrescription,
  listUserPrescriptions,
  listPendingPrescriptions,
  reviewPrescription
} from "../services/prescriptionService.js";
import { createNotification } from "../services/notificationService.js";
import sdb from "../services/database.js";
import { sendEmail } from "../services/emailService.js";

const createPrescription = async (req, res, next) => {
  try {
    const { medicine_id, file_name, file_data } = req.body;

    const prescription = await uploadPrescription({
      userId: req.user.id,
      medicineId: medicine_id,
      fileName: file_name,
      fileData: file_data
    });

    res.status(201).json(prescription);
  } catch (error) {
    next(error);
  }
};

const listPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await listUserPrescriptions(req.user.id);
    res.status(200).json(prescriptions);
  } catch (error) {
    next(error);
  }
};

const listPending = async (req, res, next) => {
  try {
    const prescriptions = await listPendingPrescriptions();
    res.status(200).json(prescriptions);
  } catch (error) {
    next(error);
  }
};

const review = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const prescription = await reviewPrescription({
      prescriptionId: req.params.id,
      reviewerId: req.user.id,
      status,
      notes
    });

    await createNotification({
      user_id: prescription.user_id,
      title: status === "approved" ? "Receita aprovada" : "Receita recusada",
      message: `Sua receita para ${prescription.Medicine?.name || "medicamento"} foi ${status === "approved" ? "aprovada" : "recusada"}.`,
      type: "prescription"
    });

    const { data: user } = await sdb.from("User").select("email").eq("id", prescription.user_id).single();
    await sendEmail({
      to: user?.email,
      subject: status === "approved" ? "Receita aprovada" : "Receita recusada",
      text: `Sua receita para ${prescription.Medicine?.name} foi ${status === "approved" ? "aprovada" : "recusada"}.`
    });

    res.status(200).json(prescription);
  } catch (error) {
    next(error);
  }
};

export { createPrescription, listPrescriptions, listPending, review };
