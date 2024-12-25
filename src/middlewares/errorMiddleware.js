const errorMiddleware = (err, req, res, next) => {
  // Default status code
  let statusCode = 500;
  let message = "Internal Server Error";

  // Map errors
  if (err.message === "User not found" || err.message === "Invalid credentials") {
    statusCode = 401; // Unauthorized
    message = err.message;
  } else if (err.message === "Database error occurred") {
    statusCode = 503; // Service Unavailable
    message = err.message;
  } else if (err.message === "Email and password are required") {
    statusCode = 400; // Bad Request
    message = err.message;
  } else if (err.message === "Product not found") {
    statusCode = 404; // Not Found
    message = err.message;
  }

  // Log
  console.error(`[ERROR] ${err.stack || err.message}`);

  // response status
  res.status(statusCode).json({ message });
};

export default errorMiddleware;