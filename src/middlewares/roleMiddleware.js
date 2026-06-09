const requireRole = (...roles) => (req, res, next) => {
  const role = req.user?.role || 'customer';

  if (!roles.includes(role)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  next();
};

export default requireRole;
