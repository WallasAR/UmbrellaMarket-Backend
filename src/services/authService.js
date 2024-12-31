import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sdb from "./database.js";
import dotenv from "dotenv";

dotenv.config();

// Generate UUID for user
function generateUniqueId() {
    return uuidv4();
};

const userLogin = async ({ email, pass }) => {
    const { data, error } = await sdb
    .from("User")
    .select("id, pass")
    .eq("email", email)
    .single();

    if (error) {
        throw new Error(error.message);
    };

    if (!data) {
        throw new Error("Invalid credentials");
    };

    const isPasswordValid = await bcrypt.compare(pass, data.pass)
    if (!isPasswordValid) {
        throw new Error("Invalid credentials")
    };

    const token = jwt.sign({ id: data.id, email: email }, process.env.JWT_TOKEN);
    return token;
};

const userRegistration = async ({ email, pass }) => {
    // Verify email has been already registered
    const { data: existingUser, error: fetchError } = await sdb
    .from("User")
    .select("email")
    .eq("email", email)

    if (fetchError) {
    throw new Error(fetchError.message);
    }

    if (existingUser.length > 0) {
    throw new Error("Email is already registered");
    }

    // password encryption
    const hashedPass = bcrypt.hashSync(pass, 10);

    // Insert the new user into the db
    const { data, error } = await sdb
    .from("User")
    .insert({
        id: generateUniqueId(),
        email: email,
        pass: hashedPass,
        avatar: "https://cdn-icons-png.flaticon.com/512/219/219988.png", // default avatar
        name: "Não definido",
        phone: "Não definido",
        cep: "Não definido",
        address: "Não definido",
    });

    if (error) {
    throw new Error("Failed to register user: " + error.message);
    }

    const token = jwt.sign({ id: hashedPass, email: email }, process.env.JWT_TOKEN);
    return token;
};

export { userLogin, userRegistration };
