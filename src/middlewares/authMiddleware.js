import jwt from "jsonwebtoken";

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

export default autenticateToken;