const { sendError } = require('../utils/responseUtils');

const notFoundMiddleware = (req, res) => {
  sendError(res, 404, 'Route not found', 'NOT_FOUND', req.requestId);
};

module.exports = notFoundMiddleware;
