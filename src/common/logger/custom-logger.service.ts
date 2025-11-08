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

  warn(message: string, metadata?: Record<string, any>) {
    this.logger.warn(message, {
      context: this.context,
      ...metadata,
    });
  }

  error(message: string, trace?: string, metadata?: Record<string, any>) {
    this.logger.error(message, {
      context: this.context,
      trace,
      ...metadata,
    });
  }

  debug(message: string) {
    this.logger.debug(message, { context: this.context });
  }

  verbose(message: string) {
    this.logger.verbose(message, { context: this.context });
  }
}
