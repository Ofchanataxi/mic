const env = require('../config/env');
const { requestService } = require('../clients/serviceClient');

const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

const buildGatewayFileUrl = (req, mediaId) => {
  const baseUrl = `${req.protocol}://${req.get('host')}/api/v1/media/${encodeURIComponent(mediaId)}/file`;
  const header = req.header('authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme === 'Bearer' && token) {
    return `${baseUrl}?accessToken=${encodeURIComponent(token)}`;
  }

  return baseUrl;
};

const getMediaAccess = asyncHandler(async (req, res) => {
  const mediaId = req.params.id;
  const access = await requestService(req, {
    baseURL: env.mediaServiceUrl,
    url: `/media/${encodeURIComponent(mediaId)}/access`,
  });

  res.json({
    ...access,
    accessUrl: buildGatewayFileUrl(req, mediaId),
  });
});

module.exports = {
  getMediaAccess,
};
