const env = require('../config/env');

const levels = { debug: 10, info: 20, warn: 30, error: 40 };
const enabled = (level) => levels[level] >= (levels[env.logLevel] || levels.info);
const format = (level, message, meta) => JSON.stringify({
  timestamp: new Date().toISOString(),
  level,
  message,
  ...(meta === undefined ? {} : { meta }),
});

module.exports = {
  debug: (message, meta) => { if (enabled('debug')) console.debug(format('debug', message, meta)); },
  info: (message, meta) => { if (enabled('info')) console.log(format('info', message, meta)); },
  warn: (message, meta) => { if (enabled('warn')) console.warn(format('warn', message, meta)); },
  error: (message, meta) => { if (enabled('error')) console.error(format('error', message, meta)); },
};
