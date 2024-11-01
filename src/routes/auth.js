// auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const fs = require("fs");
const path = require("path");

const usersFilePath = path.join(__dirname, "../db/users.json");

router.post("/login", (req, res) => {
  const { user, pass } = req.body;

  if (!user || !pass) {
    return res.status(400).json({ message: "User and password are required" });
  }

  // Load users from JSON file
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

  // Find the user
  const existingUser = users.find(u => u.user === user);
  if (!existingUser) {
    return res.status(400).json({ message: "User not found" });
  }

  // Check password
  const isPasswordValid = bcrypt.compareSync(pass, existingUser.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Generate JWT token
  const token = jwt.sign({ username: existingUser.user }, process.env.JWT_TOKEN, { expiresIn: "1h" });

  res.status(200).json({ message: "Login successful", token });
});

router.post("/register", async (req, res) => {
  const { user, pass } = req.body;
  
  if (!user || !pass) {
    return res.status(400).json({ message: "User and password is obrigatorial"});
  };
  
  // Existent users in json file
  let users = [];
  try {
    if (fs.existsSync(usersFilePath)) {
        const fileContent = fs.readFileSync(usersFilePath, "utf8");
        if (fileContent) {
            users = JSON.parse(fileContent);
        }
    }
} catch (error) {
    return res.status(500).json({ message: "Error reading file " + usersFilePath});
}

  // Check if user already exists
  const existingUser = users.find(username => username.user == user);

    if (existingUser) {
        return res.status(400).json({ message: "Usuário já existe" });
    }

  // Hash password
  const hashedPass = bcrypt.hashSync(pass, 10);

  // Add new user to array  
  const newUser = { user, password: hashedPass };
  users.push(newUser);

  // Save new user to json file
  try {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    res.status(201).json({ message: "Registered User successful" });
  } catch (error) {
    return res.status(500).json({ message: "Error to save a user" });
}

  // Generate token JWT
  const token = jwt.sign({ username: newUser.user }, process.env.JWT_TOKEN, { expiresIn: "1h"});

  res.status(201).json({ message: "Registed user successful", token });
});

// Middleware de autenticação
function autenticateToken(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(401).json({ message: "Denied Access" });
  };

  jwt.verify(token, process.env.JWT_TOKEN, (err, user) => {
  if (err) {
    return res.status(403).json({ message: "Invalid token" });
  };
  req.user = user;
  next();
  });
};

module.exports = { router, autenticateToken };