import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import sdb from "./database.js";

const KYC_DIR = path.join(path.resolve(), "src/public/kyc");

const ensureDir = () => {
  if (!fs.existsSync(KYC_DIR)) {
    fs.mkdirSync(KYC_DIR, { recursive: true });
  }
};

const uploadKycDocument = async ({ pharmacyId, documentType, fileName, fileData }) => {
  ensureDir();

  const extension = path.extname(fileName || ".pdf") || ".pdf";
  const safeName = `${pharmacyId}-${documentType}-${uuidv4()}${extension}`;
  const filePath = path.join(KYC_DIR, safeName);

  const buffer = Buffer.from(fileData, "base64");
  fs.writeFileSync(filePath, buffer);

  const fileUrl = `/static/kyc/${safeName}`;

  const { data, error } = await sdb
    .from("KycDocument")
    .insert({
      pharmacy_id: pharmacyId,
      document_type: documentType,
      file_url: fileUrl,
      status: "pending"
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await sdb.from("Pharmacy").update({ kyc_status: "documents_pending" }).eq("id", pharmacyId);

  return data;
};

const listPharmacyKycDocuments = async (pharmacyId) => {
  const { data, error } = await sdb
    .from("KycDocument")
    .select("*")
    .eq("pharmacy_id", pharmacyId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

const listPharmacyKycForAdmin = async (pharmacyId) => {
  const { data: pharmacy } = await sdb
    .from("Pharmacy")
    .select("id, name, cnpj, kyc_status, onboarding_status")
    .eq("id", pharmacyId)
    .single();

  const documents = await listPharmacyKycDocuments(pharmacyId);
  return { pharmacy, documents };
};

const reviewKycDocument = async ({ documentId, reviewerId, status, notes }) => {
  const { data, error } = await sdb
    .from("KycDocument")
    .update({
      status,
      notes,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString()
    })
    .eq("id", documentId)
    .select("*, pharmacy_id")
    .single();

  if (error) throw new Error(error.message);

  const documents = await listPharmacyKycDocuments(data.pharmacy_id);
  const allApproved = documents.length > 0 && documents.every((doc) => doc.status === "approved");
  const anyRejected = documents.some((doc) => doc.status === "rejected");

  let kycStatus = "documents_pending";
  if (allApproved) kycStatus = "verified";
  if (anyRejected) kycStatus = "rejected";

  await sdb.from("Pharmacy").update({ kyc_status: kycStatus }).eq("id", data.pharmacy_id);

  return data;
};

export {
  uploadKycDocument,
  listPharmacyKycDocuments,
  listPharmacyKycForAdmin,
  reviewKycDocument
};
