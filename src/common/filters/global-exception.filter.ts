import { ERROR_CODES } from '@/common/constants/error-codes';
import { ResponseDto } from '@/common/dto/response.dto';
import { CustomException } from '@/common/exceptions/custom-exception';
import { CustomLoggerService } from '@/common/logger/custom-logger.service';
import { LoggerFactoryService } from '@/common/logger/logger-factory.service';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private logger: CustomLoggerService;

  constructor(private readonly loggerFactory: LoggerFactoryService) {
    this.logger = this.loggerFactory.create(GlobalExceptionFilter.name);
  }

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse<Response>();

    // 사용자 정보 추출 (인증된 경우에만)
    const user = request?.user;
    const userId = user?.sub || null;

    // 요청 정보 추출
    const method = request?.method || 'UNKNOWN';
    const url = request?.url || 'UNKNOWN';
    const ip =
      request?.ip ||
      request?.socket?.remoteAddress ||
      request?.headers?.['x-forwarded-for'] ||
      'UNKNOWN';
    const userAgent = request?.headers?.['user-agent'] || null;
    const query = request?.query || {};
    const body = request?.body || {};

    // 민감 정보 제거 (비밀번호, 토큰 등)
    const sanitizedBody = this.sanitizeBody(body);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = ERROR_CODES.INTERNAL_SERVER_ERROR.code;
    let message = ERROR_CODES.INTERNAL_SERVER_ERROR.message;

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

    // 로그 메타데이터 구성
    const logMetadata: Record<string, any> = {
      method,
      url,
      ip,
      userId,
      userAgent,
    };

    if (Object.keys(query).length > 0) {
      logMetadata.query = query;
    }
    if (Object.keys(sanitizedBody).length > 0) {
      logMetadata.body = sanitizedBody;
    }

    // CustomException 처리
    if (exception instanceof CustomException) {
      status = exception.getStatus();
      statusCode = status;
      const errorResponse = exception.getResponse() as any;
      logMetadata.statusCode = statusCode;
      this.logger.error(
        `CustomException: ${exception.message}`,
        exception.stack,
        logMetadata,
      );
      return response.status(status).json(errorResponse);
    }

    // HttpException 처리, ResponseDto.error()로 변환
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody = exception.getResponse();

      if (typeof responseBody === 'string') {
        message = responseBody;
      } else if (typeof responseBody === 'object' && responseBody['message']) {
        message = responseBody['message'];
      }

      code = (typeof responseBody === 'object' && responseBody['code']) || code;
      statusCode = status;
      logMetadata.statusCode = statusCode;

      // 보안 스캔 시도로 보이는 NotFoundException은 에러 로그에 기록하지 않음
      if (status === HttpStatus.NOT_FOUND && this.isSecurityScanAttempt(url)) {
        // warn 레벨로만 기록 (에러 로그 파일에는 기록되지 않음)
        this.logger.warn(`Security scan attempt: ${method} ${url}`, {
          ip,
          userAgent,
        });
        return response
          .status(status)
          .json(ResponseDto.error(status, code, message));
      }
    }

    // etc. 에러 처리
    if (!logMetadata.statusCode) {
      logMetadata.statusCode = statusCode;
    }
    this.logger.error(
      `${exception.constructor?.name}: ${exception.message}`,
      exception.stack,
      logMetadata,
    );

    return response
      .status(status)
      .json(ResponseDto.error(status, code, message));
  }

  /**
   * 요청 본문에서 민감한 정보를 제거합니다.
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = [
      'password',
      'currentPassword',
      'newPassword',
      'confirmPassword',
      'token',
      'accessToken',
      'refreshToken',
      'authorization',
      'secret',
      'apiKey',
      'apikey',
    ];

    const sanitized = { ...body };
    for (const field of sensitiveFields) {
      for (const key in sanitized) {
        if (key.toLowerCase() === field.toLowerCase()) {
          sanitized[key] = '[REDACTED]';
        }
      }
    }

    return sanitized;
  }

  /**
   * 보안 스캔 시도로 보이는 요청인지 확인합니다.
   */
  private isSecurityScanAttempt(url: string): boolean {
    if (!url) {
      return false;
    }

    const securityScanPatterns = [
      /^\/\.env/i, // .env 파일들
      /^\/\.env\./i, // .env.* 파일들
      /^\/\.envs/i,
      /^\/\.env~/i,
      /^\/\.envrc/i,
      /^\/\.remote/i,
      /^\/\.local/i,
      /^\/\.production/i,
      /^\/config\/aws\.yml/i,
      /^\/phpinfo/i,
      /^\/symfony\/_profiler/i,
      /^\/\.git/i, // .git 디렉토리
      /^\/\.svn/i, // .svn 디렉토리
      /^\/\.htaccess/i,
      /^\/\.htpasswd/i,
      /^\/wp-admin/i, // WordPress
      /^\/wp-login/i,
      /^\/administrator/i, // Joomla
      /^\/phpmyadmin/i,
      /^\/admin/i,
      /^\/\.well-known/i, // 일부는 정상이지만 스캔 시도로 많이 사용됨
    ];

    return securityScanPatterns.some((pattern) => pattern.test(url));
  }
}
