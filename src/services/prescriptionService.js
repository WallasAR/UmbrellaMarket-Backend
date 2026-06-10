import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import sdb from "./database.js";

const PRESCRIPTION_DIR = path.join(path.resolve(), "src/public/prescriptions");

const ensureDir = () => {
  if (!fs.existsSync(PRESCRIPTION_DIR)) {
    fs.mkdirSync(PRESCRIPTION_DIR, { recursive: true });
  }
};

const getMedicineIdsForPharmacy = async (pharmacyId) => {
  const { data, error } = await sdb
    .from("Medicine")
    .select("id")
    .eq("pharmacy_id", pharmacyId);

  if (error) throw new Error(error.message);
  return (data || []).map((row) => row.id);
};

const uploadPrescription = async ({ userId, medicineId, fileName, fileData }) => {
  ensureDir();

  const extension = path.extname(fileName || ".pdf") || ".pdf";
  const safeName = `${userId}-${medicineId}-${uuidv4()}${extension}`;
  const filePath = path.join(PRESCRIPTION_DIR, safeName);

  const buffer = Buffer.from(fileData, "base64");
  fs.writeFileSync(filePath, buffer);

  const fileUrl = `/static/prescriptions/${safeName}`;

  const { data, error } = await sdb
    .from("Prescription")
    .insert({
      user_id: userId,
      medicine_id: medicineId,
      file_url: fileUrl,
      status: "pending"
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

const listUserPrescriptions = async (userId) => {
  const { data, error } = await sdb
    .from("Prescription")
    .select("*, Medicine(id, name, requires_prescription)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

const listPendingPrescriptions = async (pharmacyId = null) => {
  let query = sdb
    .from("Prescription")
    .select("*, Medicine(id, name, pharmacy_id), User(email, name)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (pharmacyId) {
    const medicineIds = await getMedicineIdsForPharmacy(pharmacyId);
    if (!medicineIds.length) return [];
    query = query.in("medicine_id", medicineIds);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
};

const getPrescriptionForReview = async (prescriptionId) => {
  const { data, error } = await sdb
    .from("Prescription")
    .select("*, Medicine(id, name, pharmacy_id)")
    .eq("id", prescriptionId)
    .single();

  if (error || !data) {
    const notFound = new Error("Prescription not found");
    notFound.status = 404;
    throw notFound;
  }

  return data;
};

const reviewPrescription = async ({ prescriptionId, reviewerId, status, notes, pharmacyId = null }) => {
  const existing = await getPrescriptionForReview(prescriptionId);

  if (pharmacyId && existing.Medicine?.pharmacy_id !== pharmacyId) {
    const forbidden = new Error("Prescription does not belong to this pharmacy");
    forbidden.status = 403;
    throw forbidden;
  }

  const { data, error } = await sdb
    .from("Prescription")
    .update({
      status,
      notes,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString()
    })
    .eq("id", prescriptionId)
    .select("*, user_id, Medicine(name)")
    .single();

  if (error) throw new Error(error.message);
  return data;
};

const hasApprovedPrescription = async (userId, medicineId) => {
  const { data, error } = await sdb
    .from("Prescription")
    .select("id")
    .eq("user_id", userId)
    .eq("medicine_id", medicineId)
    .eq("status", "approved")
    .limit(1);

  if (error) throw new Error(error.message);
  return (data || []).length > 0;
};

export {
  uploadPrescription,
  listUserPrescriptions,
  listPendingPrescriptions,
  reviewPrescription,
  hasApprovedPrescription
};
