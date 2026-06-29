import winstonLogger from '../config/logger.js';

export const logger = {
  info: (msg, meta) => winstonLogger.info(msg, meta),
  warn: (msg, meta) => winstonLogger.warn(msg, meta),
  error: (msg, meta) => winstonLogger.error(msg, meta),
  debug: (msg, meta) => winstonLogger.debug(msg, meta)
};
