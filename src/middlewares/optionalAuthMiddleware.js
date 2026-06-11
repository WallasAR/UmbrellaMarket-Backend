import jwt from "jsonwebtoken";

const optionalAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_TOKEN);
      req.user = decoded;
    } catch (err) {
      // ignore token error for optional auth
    }
  }
  next();
};

export default optionalAuthMiddleware;
