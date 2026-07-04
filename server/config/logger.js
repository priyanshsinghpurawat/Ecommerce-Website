import winston from 'winston';
import { ENV } from '../config/env.js';

const isProd = ENV.NODE_ENV === 'production';

const logger = winston.createLogger({
  level: isProd ? 'info' : 'debug',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  defaultMeta: { service: 'mensvibe-api' },
  transports: [
    new winston.transports.Console({
      format: isProd
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              const metaStr = Object.keys(meta).length > 1 ? ` ${JSON.stringify(meta)}` : '';
              return `${timestamp} ${level}: ${message}${metaStr}`;
            }),
          ),
    }),
  ],
});

if (isProd) {
  logger.add(new winston.transports.File({ filename: 'logs/error.log', level: 'error' }));
  logger.add(new winston.transports.File({ filename: 'logs/combined.log' }));
}

export default logger;
