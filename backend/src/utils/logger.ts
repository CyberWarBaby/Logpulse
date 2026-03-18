import winston from 'winston';
import path from 'path';

const { combine, timestamp, errors, json, colorize, printf, prettyPrint } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let log = `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
  if (Object.keys(meta).length) {
    log += ` ${JSON.stringify(meta)}`;
  }
  return log;
});

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: combine(
      colorize({ all: true }),
      timestamp({ format: 'HH:mm:ss' }),
      errors({ stack: true }),
      logFormat
    ),
  }),
];

// File transports in production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      format: combine(timestamp(), errors({ stack: true }), json()),
    }),
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      format: combine(timestamp(), json()),
    })
  );
}

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transports,
  exceptionHandlers: [
    new winston.transports.Console(),
  ],
  rejectionHandlers: [
    new winston.transports.Console(),
  ],
});
