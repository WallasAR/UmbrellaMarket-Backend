const errorMiddleware = (err, req, res, next) => {
  // Error mapping
  const errorMap = {
    "User Required": { statusCode: 400, message: "User Required" },
    "Profile data is required": { statusCode: 400, message: "Profile data is required" },
    "Email and password are required": { statusCode: 400, message: "Email and password are required" },
    "User, product and quantity must be specified": { statusCode: 400, message: "User, product and quantity must be specified" },
    "Product identifier and quantity must be integers": { statusCode: 400, message: "Product identifier and quantity must be integers" },
    "User not found": { statusCode: 401, message: "User not found" },
    "Invalid credentials": { statusCode: 401, message: "Invalid credentials" },
    "Product not found": { statusCode: 404, message: "Product not found" },
    "Profile data is required": { statusCode: 404, message: "Profile data is required" },
    "Product not found in the cart": { statusCode: 404, message: "Product not found in the cart" },
    "Database error occurred": { statusCode: 503, message: "Database error occurred" },
  };

  // Get the error from the map or fallback to default
  const errorResponse = errorMap[err.message] || { statusCode: 500, message: "Internal Server Error" };

  // Log the error
  console.error(`[ERROR] ${err.stack || err.message}`);

  // Send response
  res.status(errorResponse.statusCode).json({ message: errorResponse.message });
};

export default errorMiddleware;
