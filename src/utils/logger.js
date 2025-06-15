import winston from 'winston';
const { combine, timestamp, printf, colorize, align } = winston.format;
import config from '../config/config.js';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for different log levels
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Custom format for console logging
const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
  return `[${timestamp}] ${level}: ${message}${metaString}`;
});

// Custom format for file logging
const fileFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
  return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaString}`;
});

// Create the logger instance
const logger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  levels,
  format: combine(
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'library-api' },
  transports: [
    // Console transport for all environments
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        align(),
        consoleFormat
      ),
    }),
  ],
});

// In production, also log to files
if (config.env === 'production') {
  // Error logs
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat,
    })
  );

  // Combined logs
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: fileFormat,
    })
  );

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', error);
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection', reason);
    process.exit(1);
  });
}

// Create a stream for morgan (HTTP request logging)
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Export the logger as a named export
export { logger };
