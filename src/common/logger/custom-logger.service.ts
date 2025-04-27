import { LoggerService as NestLoggerService } from '@nestjs/common';
import { Logger as WinstonLogger } from 'winston';

export class CustomLoggerService implements NestLoggerService {
  private context = 'App';

  constructor(private readonly logger: WinstonLogger) {}

  setContext(context: string): this {
    this.context = context;
    return this;
  }

  log(message: string) {
    this.logger.info(message, { context: this.context });
  }

  warn(message: string) {
    this.logger.warn(message, { context: this.context });
  }

  error(message: string, trace?: string) {
    this.logger.error(message, { context: this.context, trace });
  }

  debug(message: string) {
    this.logger.debug(message, { context: this.context });
  }

  verbose(message: string) {
    this.logger.verbose(message, { context: this.context });
  }
}
