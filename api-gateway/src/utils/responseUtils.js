const sendError = (res, statusCode, message, code, requestId) => {
  res.status(statusCode).json({
    error: {
      message,
      code,
      requestId,
    },
  });
};

module.exports = {
  sendError,
};
