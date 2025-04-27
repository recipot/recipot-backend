import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import path from 'path';
import fs from 'fs';
import * as process from 'node:process';

const { name: appName } = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8'),
);

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
  ],
};
