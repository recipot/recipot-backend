import { Injectable, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { CustomLoggerService } from './custom-logger.service';

@Injectable()
export class LoggerFactoryService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly winstonLogger: WinstonLogger,
  ) {}

  create(context: string): CustomLoggerService {
    return new CustomLoggerService(this.winstonLogger).setContext(context);
  }
}
