import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sdb from "./database.js";
import dotenv from "dotenv";

dotenv.config();

function generateUniqueId() {
  return uuidv4();
}

const signToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role || "customer",
      pharmacy_id: user.pharmacy_id || null
    },
    process.env.JWT_TOKEN
  );

const userLogin = async ({ email, pass }) => {
  const { data, error } = await sdb
    .from("User")
    .select("id, pass, role, email, pharmacy_id")
    .eq("email", email)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Invalid credentials");

  const isPasswordValid = await bcrypt.compare(pass, data.pass);
  if (!isPasswordValid) throw new Error("Invalid credentials");

  return signToken(data);
};

const userRegistration = async ({ email, pass }) => {
  const { data: existingUser, error: fetchError } = await sdb
    .from("User")
    .select("email")
    .eq("email", email);

  if (fetchError) throw new Error(fetchError.message);
  if (existingUser.length > 0) throw new Error("Email is already registered");

  const hashedPass = bcrypt.hashSync(pass, 10);
  const userId = generateUniqueId();

  const { error } = await sdb.from("User").insert({
    id: userId,
    email,
    pass: hashedPass,
    role: "customer",
    avatar: "https://cdn-icons-png.flaticon.com/512/219/219988.png",
    name: "Não definido",
    phone: "Não definido",
    cep: "Não definido",
    address: "Não definido"
  });

  if (error) throw new Error("Failed to register user: " + error.message);

  return signToken({ id: userId, email, role: "customer" });
};

export { userLogin, userRegistration };
