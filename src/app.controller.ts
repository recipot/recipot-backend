import { Public } from '@/api/auth/decorators/auth.decorators';
import { renderTemplate } from '@/common/utils/template.util';
import { ConfigService } from '@/config/config.service';
import { Controller, Get, Logger, OnModuleInit, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import axios from 'axios';
import { Response } from 'express';

interface HealthStatus {
  statusText: string;
  statusClass: string;
  messageText: string;
}

@ApiExcludeController()
@Controller()
export class AppController implements OnModuleInit {
  private readonly logger = new Logger(AppController.name);
  private isServerReady = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    setTimeout(() => {
      this.isServerReady = true;
      this.logger.log('Server is ready for health checks');
    }, 2000);
  }

  private async checkHealthStatus(): Promise<HealthStatus> {
    // 서버가 준비되지 않았으면 기본 상태 반환
    if (!this.isServerReady) {
      return {
        statusText: '● Starting',
        statusClass: 'status',
        messageText: '서버가 시작 중입니다...',
      };
    }

    const apiBaseUrl = process.env.API_DOMAIN!;

    try {
      const healthResponse = await axios.get(`${apiBaseUrl}/v1/health`, {
        timeout: 2000,
      });

      const healthStatus = healthResponse.data?.data?.status;

      if (healthStatus === 'ok') {
        return {
          statusText: '● Running',
          statusClass: 'status',
          messageText: '백엔드 서버가 정상적으로 실행 중입니다.',
        };
      }

      return {
        statusText: '⚠ Degraded',
        statusClass: 'status degraded',
        messageText: '일부 서비스에 문제가 있을 수 있습니다.',
      };
    } catch (error) {
      this.logger.warn('Health check failed', {
        message: error.message,
        url: `${apiBaseUrl}/v1/health`,
        stack: error.stack,
      });

      return {
        statusText: '● Running',
        statusClass: 'status',
        messageText: '백엔드 서버가 실행 중입니다. (상태 확인 중...)',
      };
    }
  }

  @Get()
  @Public()
  async getStatus(@Res() res: Response) {
    const healthStatus = await this.checkHealthStatus();
    const port =
      this.configService.get<number>('HTTP_PORT') ||
      parseInt(process.env.HTTP_PORT || '8080', 10);
    const env = process.env.ENV || process.env.NODE_ENV || 'local';
    const swaggerPath = process.env.SWAGGER_PATH;
    const githubUrl = 'https://github.com/recipot/recipot-backend';

    const html = await renderTemplate('main-page', {
      STATUS_CLASS: healthStatus.statusClass,
      STATUS_TEXT: healthStatus.statusText,
      MESSAGE_TEXT: healthStatus.messageText,
      SWAGGER_PATH: swaggerPath,
      GITHUB_URL: githubUrl,
      ENV: env,
      PORT: port.toString(),
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }
}
