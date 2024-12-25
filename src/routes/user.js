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
