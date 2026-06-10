import {
  ALL_PERMISSIONS,
  listPharmacyStaff,
  assignStaffMember,
  setStaffPermissions,
  removeStaffMember
} from "../services/staffService.js";
import { logAudit } from "../services/auditService.js";

const listTeam = async (req, res, next) => {
  try {
    const staff = await listPharmacyStaff(req.pharmacyId);
    res.status(200).json({ permissions: ALL_PERMISSIONS, staff });
  } catch (error) {
    next(error);
  }
};

const addTeamMember = async (req, res, next) => {
  try {
    const member = await assignStaffMember({
      pharmacyId: req.pharmacyId,
      email: req.body.email,
      role: req.body.role,
      grantedBy: req.user.id
    });

    await logAudit({
      actorId: req.user.id,
      action: "team.member_added",
      entityType: "User",
      entityId: member.id,
      payload: { role: member.role, pharmacy_id: req.pharmacyId },
      ipAddress: req.ip
    });

    res.status(201).json(member);
  } catch (error) {
    next(error);
  }
};

const updateTeamPermissions = async (req, res, next) => {
  try {
    const permissions = await setStaffPermissions({
      pharmacyId: req.pharmacyId,
      userId: req.params.userId,
      permissions: req.body.permissions || [],
      grantedBy: req.user.id
    });

    await logAudit({
      actorId: req.user.id,
      action: "team.permissions_updated",
      entityType: "User",
      entityId: req.params.userId,
      payload: { permissions, pharmacy_id: req.pharmacyId },
      ipAddress: req.ip
    });

    res.status(200).json({ permissions });
  } catch (error) {
    next(error);
  }
};

const removeTeamMember = async (req, res, next) => {
  try {
    await removeStaffMember({ pharmacyId: req.pharmacyId, userId: req.params.userId });

    await logAudit({
      actorId: req.user.id,
      action: "team.member_removed",
      entityType: "User",
      entityId: req.params.userId,
      payload: { pharmacy_id: req.pharmacyId },
      ipAddress: req.ip
    });

    res.status(200).json({ message: "Member removed" });
  } catch (error) {
    next(error);
  }
};

export { listTeam, addTeamMember, updateTeamPermissions, removeTeamMember };
