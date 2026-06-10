import {
  uploadKycDocument,
  listPharmacyKycDocuments,
  listPharmacyKycForAdmin,
  reviewKycDocument
} from "../services/kycService.js";
import { logAudit } from "../services/auditService.js";

const uploadDocument = async (req, res, next) => {
  try {
    const { document_type, file_name, file_data } = req.body;
    const document = await uploadKycDocument({
      pharmacyId: req.pharmacyId,
      documentType: document_type,
      fileName: file_name,
      fileData: file_data
    });

    await logAudit({
      actorId: req.user.id,
      action: "kyc.document_uploaded",
      entityType: "KycDocument",
      entityId: document.id,
      payload: { document_type },
      ipAddress: req.ip
    });

    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
};

const listDocuments = async (req, res, next) => {
  try {
    const documents = await listPharmacyKycDocuments(req.pharmacyId);
    res.status(200).json(documents);
  } catch (error) {
    next(error);
  }
};

const adminListDocuments = async (req, res, next) => {
  try {
    const data = await listPharmacyKycForAdmin(req.params.pharmacyId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const reviewDocument = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const document = await reviewKycDocument({
      documentId: req.params.id,
      reviewerId: req.user.id,
      status,
      notes
    });

    await logAudit({
      actorId: req.user.id,
      action: `kyc.document_${status}`,
      entityType: "KycDocument",
      entityId: document.id,
      payload: { status, notes, pharmacy_id: document.pharmacy_id },
      ipAddress: req.ip
    });

    res.status(200).json(document);
  } catch (error) {
    next(error);
  }
};

export { uploadDocument, listDocuments, adminListDocuments, reviewDocument };
