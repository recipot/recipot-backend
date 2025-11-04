import fs from 'fs';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as process from 'node:process';
import path from 'path';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { name: appName } = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8'),
);

// Ensure logs directory exists for file transports
const logsDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Retention days from env (only variable to manage)
const errorRetentionDays = Number(process.env.LOG_ERROR_RETENTION_DAYS || '7');

export const winstonConfig = {
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        nestWinstonModuleUtilities.format.nestLike(appName, {
          prettyPrint: true,
          colors: true,
        }),
      ),
    }),
    // Daily rotation for error-level logs, keep last 7 days
    new DailyRotateFile({
      level: 'error',
      dirname: logsDir,
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: false,
      maxFiles: `${isNaN(errorRetentionDays) ? 7 : errorRetentionDays}d`,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
    }),
  ],
};
