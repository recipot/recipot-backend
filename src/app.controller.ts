import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
export class AppController {
  @Get()
  getStatus() {
    return {
      status: 'ok',
      message: 'Recipot Backend is running',
      healthCheck: '/v1/health',
    };
  }
}
