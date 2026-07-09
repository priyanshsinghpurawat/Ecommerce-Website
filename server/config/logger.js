import winston from 'winston';
import fs from 'fs';
import path from 'path';
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
  const logDir = 'logs';
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
  logger.add(
    new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
  );
  logger.add(new winston.transports.File({ filename: path.join(logDir, 'combined.log') }));
}

export default logger;
