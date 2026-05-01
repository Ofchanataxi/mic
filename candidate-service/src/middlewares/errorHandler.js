const { ApiError } = require("../utils/apiError");

function notFoundHandler(req, res, next) {
  next(new ApiError(404, "Route not found"));
}

function errorHandler(error, req, res, next) {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      message: error.message,
      details: error.details
    });
  }

  console.error(error);

  return res.status(500).json({
    message: "Internal server error"
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
