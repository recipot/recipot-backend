import { Public } from '@/api/auth/decorators/auth.decorators';
import { renderTemplate } from '@/common/utils/template.util';
import { Controller, Get, Res } from '@nestjs/common';
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
export class AppController {
  /**
   * API Base URL을 환경 변수에 따라 결정합니다.
   */
  private getApiBaseUrl(): string {
    if (process.env.API_DOMAIN.includes('localhost')) {
      return `http://${process.env.API_DOMAIN}`;
    }

    return `https://${process.env.API_DOMAIN}`;
  }

  /**
   * Health Check를 통해 서버 상태를 확인합니다.
   */
  private async checkHealthStatus(): Promise<HealthStatus> {
    const apiBaseUrl = this.getApiBaseUrl();

    try {
      const healthResponse = await axios.get(`${apiBaseUrl}/v1/health`, {
        timeout: 2000,
      });

      // ResponseDto로 감싸진 응답 구조: {status: 200, data: {status: "ok", ...}}
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
    } catch {
      // Health check 실패 시에도 서버는 실행 중이므로 Running으로 표시
      return {
        statusText: '● Running',
        statusClass: 'status',
        messageText: '백엔드 서버가 실행 중입니다. (상태 확인 중...)',
      };
    }
  }

  @Get()
  @Public()
  async getMainPage(@Res() res: Response) {
    const swaggerPath = process.env.SWAGGER_PATH || '/docs';
    const githubUrl =
      process.env.GITHUB_URL || 'https://github.com/recipot/recipot-backend';
    const env = process.env.ENV || process.env.NODE_ENV || 'local';
    const port = process.env.HTTP_PORT || '8080';

    const healthStatus = await this.checkHealthStatus();

    const html = renderTemplate('main-page', {
      STATUS_TEXT: healthStatus.statusText,
      STATUS_CLASS: healthStatus.statusClass,
      MESSAGE_TEXT: healthStatus.messageText,
      SWAGGER_PATH: swaggerPath,
      GITHUB_URL: githubUrl,
      ENV: env,
      PORT: port,
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }
}
