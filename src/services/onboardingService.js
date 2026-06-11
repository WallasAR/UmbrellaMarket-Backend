import sdb from "./database.js";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const getPlanByTier = async (tier) => {
  const { data, error } = await sdb
    .from("SaasPlan")
    .select("*")
    .eq("tier", tier)
    .eq("active", true)
    .single();

  if (error || !data) throw new Error("Plan not found");
  return data;
};

const completePharmacyInvite = async (payload) => {
  const { token, password, is_online_only, cnpj, alvara, primary_color } = payload;

  // 1. Verify token
  const { data: invite, error: inviteError } = await sdb
    .from("PharmacyInvite")
    .select("*")
    .eq("token", token)
    .single();

  if (inviteError || !invite) {
    throw new Error("Invalid or missing invite token");
  }

  if (invite.used) {
    throw new Error("Invite token has already been used");
  }

  if (new Date(invite.expires_at) < new Date()) {
    throw new Error("Invite token has expired");
  }

  // 2. Check if user already exists
  const { data: existingUser } = await sdb
    .from("User")
    .select("id")
    .eq("email", invite.email)
    .single();

  let userId;

  if (existingUser) {
    userId = existingUser.id;
    // Update role and pharmacy
    await sdb.from("User").update({
      role: "pharmacist",
      pharmacy_id: invite.pharmacy_id,
      pass: password ? bcrypt.hashSync(password, 10) : undefined // Update password if provided
    }).eq("id", userId);
  } else {
    // Create new user
    userId = uuidv4();
    const hashedPass = bcrypt.hashSync(password, 10);
    const { error: userError } = await sdb.from("User").insert({
      id: userId,
      email: invite.email,
      pass: hashedPass,
      role: "pharmacist",
      pharmacy_id: invite.pharmacy_id,
      avatar: "https://cdn-icons-png.flaticon.com/512/219/219988.png",
      name: "Dono da Farmácia",
      phone: "Não definido",
      cep: "Não definido",
      address: "Não definido"
    });

    if (userError) throw new Error("Failed to create user: " + userError.message);
  }

  // 3. Update Pharmacy
  const { error: pharmacyError } = await sdb
    .from("Pharmacy")
    .update({
      cnpj,
      onboarding_status: "approved",
      active: true,
      owner_user_id: userId,
      operational_status: "open"
    })
    .eq("id", invite.pharmacy_id);

  if (pharmacyError) throw new Error("Failed to update pharmacy: " + pharmacyError.message);

  // 4. Mark invite as used
  await sdb.from("PharmacyInvite").update({ used: true }).eq("id", invite.id);

  // Return a JWT so they can automatically log in
  const signedToken = jwt.sign(
    {
      id: userId,
      email: invite.email,
      role: "pharmacist",
      pharmacy_id: invite.pharmacy_id
    },
    process.env.JWT_TOKEN
  );

  return { token: signedToken, message: "Onboarding complete" };
};

export { completePharmacyInvite, getPlanByTier };
