import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService extends NestConfigService {
  constructor(internalConfig?: Record<string, any>) {
    super(internalConfig);
  }
}
