/**
 * Global Mongoose Error Handler Middleware
 * 
 * Catches Mongoose-specific errors (Validation, CastError, Duplicate Key) 
 * and formats them into readable 400 Bad Request responses. Let unhandled 
 * errors fall through to a generic 500 Server Error response. This prevents 
 * Vercel Serverless Functions from crashing or returning generic 500 pages.
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for developer
  console.error('❌ Error:', err.name, err.message);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with ID of ${err.value}`;
    error = new Error(message);
    error.statusCode = 404;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new Error(message);
    error.statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new Error(message);
    error.statusCode = 400;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};

module.exports = errorHandler;
