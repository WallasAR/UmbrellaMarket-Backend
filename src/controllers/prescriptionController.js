import {
  uploadPrescription,
  listUserPrescriptions,
  listPendingPrescriptions,
  reviewPrescription,
  listUserPrescriptionLists
} from "../services/prescriptionService.js";
import { createNotification } from "../services/notificationService.js";
import { logAudit } from "../services/auditService.js";
import sdb from "../services/database.js";
import { sendEmail } from "../services/emailService.js";

const resolvePharmacyScope = async (user, queryPharmacyId) => {
  if (user.role === "pharmacist") {
    const { data } = await sdb.from("User").select("pharmacy_id").eq("id", user.id).single();
    return data?.pharmacy_id || null;
  }

  if (user.role === "admin" && queryPharmacyId) {
    return queryPharmacyId;
  }

  return null;
};

const notifyPrescriptionReview = async (prescription, status) => {
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
};

const createPrescription = async (req, res, next) => {
  try {
    const { medicine_id, file_name, file_data } = req.body;

    const prescription = await uploadPrescription({
      userId: req.user.id,
      medicineId: medicine_id,
      fileName: file_name,
      fileData: file_data
    });

    await logAudit({
      actorId: req.user.id,
      action: "prescription.uploaded",
      entityType: "Prescription",
      entityId: prescription.id,
      payload: { medicine_id },
      ipAddress: req.ip
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
    const pharmacyId = await resolvePharmacyScope(req.user, req.query.pharmacyId);
    const prescriptions = await listPendingPrescriptions(pharmacyId);
    res.status(200).json(prescriptions);
  } catch (error) {
    next(error);
  }
};

const review = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const pharmacyId = await resolvePharmacyScope(req.user, req.query.pharmacyId);

    const prescription = await reviewPrescription({
      prescriptionId: req.params.id,
      reviewerId: req.user.id,
      status,
      notes,
      pharmacyId
    });

    await logAudit({
      actorId: req.user.id,
      action: `prescription.${status}`,
      entityType: "Prescription",
      entityId: prescription.id,
      payload: { status, notes, user_id: prescription.user_id },
      ipAddress: req.ip
    });

    await notifyPrescriptionReview(prescription, status);

    res.status(200).json(prescription);
  } catch (error) {
    next(error);
  }
};

const listPharmacyPending = async (req, res, next) => {
  try {
    const prescriptions = await listPendingPrescriptions(req.pharmacyId);
    res.status(200).json(prescriptions);
  } catch (error) {
    next(error);
  }
};

const reviewPharmacyPrescription = async (req, res, next) => {
  try {
    const { status, notes } = req.body;

    const prescription = await reviewPrescription({
      prescriptionId: req.params.id,
      reviewerId: req.user.id,
      status,
      notes,
      pharmacyId: req.pharmacyId
    });

    await logAudit({
      actorId: req.user.id,
      action: `prescription.${status}`,
      entityType: "Prescription",
      entityId: prescription.id,
      payload: { status, notes, pharmacy_id: req.pharmacyId },
      ipAddress: req.ip
    });

    await notifyPrescriptionReview(prescription, status);

    res.status(200).json(prescription);
  } catch (error) {
    next(error);
  }
};

const listPrescriptionLists = async (req, res, next) => {
  try {
    const lists = await listUserPrescriptionLists(req.user.id);
    res.status(200).json(lists);
  } catch (error) {
    next(error);
  }
};

export {
  createPrescription,
  listPrescriptions,
  listPrescriptionLists,
  listPending,
  review,
  listPharmacyPending,
  reviewPharmacyPrescription
};
