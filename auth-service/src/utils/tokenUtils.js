const crypto = require('crypto');

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

const createOpaqueToken = () => crypto.randomBytes(48).toString('base64url');

const parseDurationMs = (value) => {
  const match = String(value || '').trim().match(/^(\d+)(ms|s|m|h|d)?$/i);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const amount = Number(match[1]);
  const unit = (match[2] || 'ms').toLowerCase();
  const multipliers = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return amount * multipliers[unit];
};

module.exports = {
  sha256,
  createOpaqueToken,
  parseDurationMs,
};
