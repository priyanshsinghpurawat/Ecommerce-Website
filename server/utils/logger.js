import { ENV } from '../config/env.js';

const levels = {
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
  debug: 'DEBUG'
};

const formatLog = (level, message, meta = {}) => {
  const log = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
    env: ENV.NODE_ENV
  };

  if (ENV.NODE_ENV === 'production') {
    return JSON.stringify(log);
  }

  // Colorize for development
  const colors = {
    INFO: '\x1b[32m',
    WARN: '\x1b[33m',
    ERROR: '\x1b[31m',
    DEBUG: '\x1b[34m',
    RESET: '\x1b[0m'
  };

  return `${colors[level]}${level}${colors.RESET} [${log.timestamp}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
};

export const logger = {
  info: (msg, meta) => console.log(formatLog(levels.info, msg, meta)),
  warn: (msg, meta) => console.warn(formatLog(levels.warn, msg, meta)),
  error: (msg, meta) => console.error(formatLog(levels.error, msg, meta)),
  debug: (msg, meta) => {
    if (ENV.NODE_ENV === 'development') {
      console.log(formatLog(levels.debug, msg, meta));
    }
  }
};
