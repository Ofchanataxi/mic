const env = require('../config/env');

const levels = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const shouldLog = (level) => levels[level] >= (levels[env.logLevel] || levels.info);

const format = (level, message, meta) => JSON.stringify({
  timestamp: new Date().toISOString(),
  level,
  message,
  ...(meta === undefined ? {} : { meta }),
});

module.exports = {
  debug: (message, meta) => {
    if (shouldLog('debug')) console.debug(format('debug', message, meta));
  },
  info: (message, meta) => {
    if (shouldLog('info')) console.log(format('info', message, meta));
  },
  warn: (message, meta) => {
    if (shouldLog('warn')) console.warn(format('warn', message, meta));
  },
  error: (message, meta) => {
    if (shouldLog('error')) console.error(format('error', message, meta));
  },
};
