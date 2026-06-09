const requireFields = (payload, fields) => {
  const missing = fields.filter((field) => {
    const value = payload[field];
    return value === undefined || value === null || value === "";
  });

  if (missing.length) {
    const error = new Error(`Missing required fields: ${missing.join(", ")}`);
    error.status = 400;
    throw error;
  }
};

const oneOf = (value, allowed, fieldName = "value") => {
  if (!allowed.includes(value)) {
    const error = new Error(`Invalid ${fieldName}. Allowed: ${allowed.join(", ")}`);
    error.status = 400;
    throw error;
  }
};

export { requireFields, oneOf };
