const format = (level, message, meta) => {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta === undefined ? {} : { meta }),
  };
  return JSON.stringify(payload);
};

module.exports = {
  info: (message, meta) => console.log(format('info', message, meta)),
  warn: (message, meta) => console.warn(format('warn', message, meta)),
  error: (message, meta) => console.error(format('error', message, meta)),
  debug: (message, meta) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(format('debug', message, meta));
    }
  },
};
