// auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const usersFilePath = path.join(__dirname, "../db/users.json");

// Função para gerar ID único
function generateUniqueId() {
    return uuidv4();
}

// Middleware para autenticar token
function autenticateToken(req, res, next) {
    const token = req.headers["authorization"];

    if (!token) {
        return res.status(401).json({ message: "Denied Access" });
    }

    jwt.verify(token, process.env.JWT_TOKEN, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Invalid token" });
        }
        req.user = user;
        next();
    });
}

// Rota de login
router.post("/login", (req, res) => {
    const { user, pass } = req.body;

    if (!user || !pass) {
        return res.status(400).json({ message: "User and password are required" });
    }

    let users = [];
    try {
        if (fs.existsSync(usersFilePath)) {
            const fileContent = fs.readFileSync(usersFilePath, "utf8");
            if (fileContent) {
                users = JSON.parse(fileContent);
            }
        }
    } catch (error) {
        return res.status(500).json({ message: "Error reading users file" });
    }

    const existingUser = users.find(u => u.user === user);
    if (!existingUser) {
        return res.status(400).json({ message: "User not found" });
    }

    const isPasswordValid = bcrypt.compareSync(pass, existingUser.password);
    if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: existingUser.id, username: existingUser.user }, process.env.JWT_TOKEN);
    res.status(200).json({ message: "Login successful", token });
});

// Rota de registro
router.post("/register", async (req, res) => {
    const { user, pass } = req.body;

    if (!user || !pass) {
        return res.status(400).json({ message: "User and password are required" });
    }

    let users = [];
    try {
        if (fs.existsSync(usersFilePath)) {
            const fileContent = fs.readFileSync(usersFilePath, "utf8");
            if (fileContent) {
                users = JSON.parse(fileContent);
            }
        }
    } catch (error) {
        return res.status(500).json({ message: "Error reading users file" });
    }

    const existingUser = users.find(u => u.user === user);
    if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
    }

    const hashedPass = bcrypt.hashSync(pass, 10);
    const newUser = { 
      id: generateUniqueId(), 
      user: user, 
      password: hashedPass,
      avatar: "https://cdn-icons-png.flaticon.com/512/219/219988.png", // default avatar
      completeName: "Não definido",
      email: "Não definido",
      phone: "Não definido",
      address: "Não definido",
      cep: "Não definido"
    };
    users.push(newUser);

    try {
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    } catch (error) {
        return res.status(500).json({ message: "Error saving user" });
    }

    const token = jwt.sign({ id: newUser.id, username: newUser.user }, process.env.JWT_TOKEN);
    res.status(201).json({ message: "Registered successfully", token });
});

// Rota para buscar dados do usuário autenticado
router.get("/users", autenticateToken, (req, res) => {
    const userId = req.user.id;

    try {
        const fileContent = fs.readFileSync(usersFilePath, "utf8");
        const userData = JSON.parse(fileContent);

        const user = userData.find(user => user.id === userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Error reading users data" });
    }
});

router.put("/profile", autenticateToken, (req, res) => {
  const userId = req.user.id;
  const updatedData = req.body;

  try {
    const users = JSON.parse(fs.readFileSync(usersFilePath, "utf8"));
    const userIndex = users.findIndex(user => user.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({ message: "User not Found" });
    }

    // Atualiza os dados do usuário
    users[userIndex] = { ...users[userIndex], ...updatedData };

    // Salva as alterações
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    res.status(200).json({ message: "Updated Profile" });
  } catch (error) {
    res.status(500).json({ message: "Error to update profile" });
  }
});


module.exports = { router, autenticateToken };
