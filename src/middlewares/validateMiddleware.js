const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join("; ");
    const error = new Error(message);
    error.status = 400;
    return next(error);
  }

  req.body = result.data;
  next();
};

const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);

  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join("; ");
    const error = new Error(message);
    error.status = 400;
    return next(error);
  }

  req.query = result.data;
  next();
};

export { validateBody, validateQuery };
