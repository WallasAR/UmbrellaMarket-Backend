import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import sdb from "../services/database.js";

dotenv.config();

async function autenticateToken(req, res, next) {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(401).json({ message: "Denied Access" });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_TOKEN);

    if (!user.role) {
      const { data } = await sdb.from("User").select("role").eq("id", user.id).single();
      user.role = data?.role || "customer";
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
}

export default autenticateToken;
