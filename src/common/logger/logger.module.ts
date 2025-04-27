import { Module, Global } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './winston.config';
import { LoggerFactoryService } from './logger-factory.service';

@Global()
@Module({
  imports: [WinstonModule.forRoot(winstonConfig)],
  providers: [LoggerFactoryService],
  exports: [LoggerFactoryService],
})
export class LoggerModule {}
