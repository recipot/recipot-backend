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

interface RequestInfo {
  method: string;
  url: string;
  ip: string;
  userId: string | null;
  userAgent: string | null;
  query: any;
  body: any;
}

interface ErrorInfo {
  status: number;
  code: string;
  message: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private static readonly SENSITIVE_FIELDS = [
    'token',
    'accessToken',
    'refreshToken',
    'authorization',
    'secret',
    'apiKey',
    'apikey',
  ];

  private static readonly SECURITY_SCAN_PATTERNS = [
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

  private logger: CustomLoggerService;

  constructor(private readonly loggerFactory: LoggerFactoryService) {
    this.logger = this.loggerFactory.create(GlobalExceptionFilter.name);
  }

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse<Response>();

    const requestInfo = this.extractRequestInfo(request);
    const logMetadata = this.buildLogMetadata(requestInfo);

    // CustomException 처리
    if (exception instanceof CustomException) {
      return this.handleCustomException(exception, response, logMetadata);
    }

    // HttpException 처리
    if (exception instanceof HttpException) {
      return this.handleHttpException(
        exception,
        response,
        logMetadata,
        requestInfo,
      );
    }

    // 기타 예외 처리
    return this.handleUnknownException(exception, response, logMetadata);
  }

  /**
   * 요청 정보를 추출합니다.
   */
  private extractRequestInfo(request: any): RequestInfo {
    const user = request?.user;
    const userId = user?.sub || null;

    return {
      method: request?.method || 'UNKNOWN',
      url: request?.url || 'UNKNOWN',
      ip:
        request?.ip ||
        request?.socket?.remoteAddress ||
        request?.headers?.['x-forwarded-for'] ||
        'UNKNOWN',
      userId,
      userAgent: request?.headers?.['user-agent'] || null,
      query: request?.query || {},
      body: request?.body || {},
    };
  }

  /**
   * 로그 메타데이터를 구성합니다.
   */
  private buildLogMetadata(requestInfo: RequestInfo): Record<string, any> {
    const logMetadata: Record<string, any> = {
      method: requestInfo.method,
      url: requestInfo.url,
      ip: requestInfo.ip,
      userId: requestInfo.userId,
      userAgent: requestInfo.userAgent,
    };

    if (requestInfo.query && Object.keys(requestInfo.query).length > 0) {
      logMetadata.query = this.sanitizeBody(requestInfo.query);
    }

    const sanitizedBody = this.sanitizeBody(requestInfo.body);
    if (Object.keys(sanitizedBody).length > 0) {
      logMetadata.body = sanitizedBody;
    }

    return logMetadata;
  }

  /**
   * CustomException을 처리합니다.
   */
  private handleCustomException(
    exception: CustomException,
    response: Response,
    logMetadata: Record<string, any>,
  ): Response {
    const status = exception.getStatus();
    const errorResponse = exception.getResponse() as any;

    logMetadata.statusCode = status;
    this.logger.error(
      `CustomException: ${exception.message}`,
      exception.stack,
      logMetadata,
    );

    return response.status(status).json(errorResponse);
  }

  /**
   * HttpException을 처리합니다.
   */
  private handleHttpException(
    exception: HttpException,
    response: Response,
    logMetadata: Record<string, any>,
    requestInfo: RequestInfo,
  ): Response {
    const status = exception.getStatus();
    const responseBody = exception.getResponse();

    const errorInfo = this.extractErrorInfoFromHttpException(
      responseBody,
      status,
    );

    logMetadata.statusCode = status;

    // 보안 스캔 시도로 보이는 NotFoundException은 에러 로그에 기록하지 않음
    if (
      status === HttpStatus.NOT_FOUND &&
      this.isSecurityScanAttempt(requestInfo.url)
    ) {
      this.logger.warn(
        `Security scan attempt: ${requestInfo.method} ${requestInfo.url}`,
        {
          ip: requestInfo.ip,
          userAgent: requestInfo.userAgent,
        },
      );
      return response
        .status(status)
        .json(ResponseDto.error(status, errorInfo.code, errorInfo.message));
    }

    this.logger.error(
      `HttpException: ${exception.message}`,
      exception.stack,
      logMetadata,
    );

    return response
      .status(status)
      .json(ResponseDto.error(status, errorInfo.code, errorInfo.message));
  }

  /**
   * HttpException의 responseBody에서 에러 정보를 추출합니다.
   */
  private extractErrorInfoFromHttpException(
    responseBody: any,
    status: number,
  ): ErrorInfo {
    let message = '';
    let codeFromResponse: string | null = null;

    if (typeof responseBody === 'string') {
      message = responseBody;
    } else if (typeof responseBody === 'object' && responseBody['message']) {
      message = responseBody['message'];
      if (responseBody['code']) {
        codeFromResponse = responseBody['code'];
      }
    }

    // responseBody에서 가져온 code가 유효한지 확인
    if (codeFromResponse && this.isValidErrorCode(codeFromResponse)) {
      const foundCode = this.findErrorCodeByCode(codeFromResponse);
      if (foundCode) {
        return {
          status,
          code: foundCode.code,
          message: foundCode.message,
        };
      }
    }

    // 메시지 기반으로 error-codes.ts에서 적절한 에러 코드 찾기
    const foundError = this.findErrorCodeByMessage(message, status);
    if (foundError) {
      return {
        status,
        code: foundError.code,
        message: foundError.message,
      };
    }

    // 기본값 사용
    return {
      status,
      code: ERROR_CODES.INTERNAL_SERVER_ERROR.code,
      message: ERROR_CODES.INTERNAL_SERVER_ERROR.message,
    };
  }

  /**
   * 알 수 없는 예외를 처리합니다.
   */
  private handleUnknownException(
    exception: any,
    response: Response,
    logMetadata: Record<string, any>,
  ): Response {
    let errorInfo: ErrorInfo = {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ERROR_CODES.INTERNAL_SERVER_ERROR.code,
      message: ERROR_CODES.INTERNAL_SERVER_ERROR.message,
    };

    // 예외에서 정보 추출 시도
    if (exception?.message) {
      const foundError = this.findErrorCodeByMessage(
        exception.message,
        errorInfo.status,
      );
      if (foundError) {
        errorInfo = {
          status: errorInfo.status,
          code: foundError.code,
          message: foundError.message,
        };
      }
    }

    // 최종 검증: code가 error-codes.ts에 정의되어 있는지 확인
    if (!this.isValidErrorCode(errorInfo.code)) {
      errorInfo = {
        status: errorInfo.status,
        code: ERROR_CODES.INTERNAL_SERVER_ERROR.code,
        message: ERROR_CODES.INTERNAL_SERVER_ERROR.message,
      };
    }

    if (!logMetadata.statusCode) {
      logMetadata.statusCode = errorInfo.status;
    }

    this.logger.error(
      `${exception.constructor?.name}: ${exception.message}`,
      exception.stack,
      logMetadata,
    );

    return response
      .status(errorInfo.status)
      .json(
        ResponseDto.error(errorInfo.status, errorInfo.code, errorInfo.message),
      );
  }

  /**
   * 메시지를 기반으로 ERROR_CODES에서 적절한 에러 코드를 찾습니다.
   */
  private findErrorCodeByMessage(
    message: string,
    status: number,
  ): { code: string; message: string } | null {
    // ERROR_CODES의 모든 값들을 순회하며 메시지가 일치하는지 확인
    for (const errorCode of Object.values(ERROR_CODES)) {
      if (errorCode.message === message) {
        return errorCode;
      }
    }

    // 메시지가 일치하지 않으면 상태 코드 기반으로 기본 에러 코드 반환
    const statusCodeMap: Record<number, { code: string; message: string }> = {
      [HttpStatus.UNAUTHORIZED]: ERROR_CODES.AUTH_REQUIRED,
      [HttpStatus.FORBIDDEN]: ERROR_CODES.AUTH_PERMISSION_DENIED,
      [HttpStatus.BAD_REQUEST]: ERROR_CODES.INVALID_REQUEST_DATA,
    };

    return statusCodeMap[status] || null;
  }

  /**
   * 코드를 기반으로 ERROR_CODES에서 에러 코드를 찾습니다.
   */
  private findErrorCodeByCode(
    code: string,
  ): { code: string; message: string } | null {
    for (const errorCode of Object.values(ERROR_CODES)) {
      if (errorCode.code === code) {
        return errorCode;
      }
    }
    return null;
  }

  /**
   * 주어진 코드가 ERROR_CODES에 정의되어 있는지 확인합니다.
   */
  private isValidErrorCode(code: string): boolean {
    return this.findErrorCodeByCode(code) !== null;
  }

  /**
   * 요청 본문에서 민감한 정보를 제거합니다.
   * 대소문자를 구분하지 않고 검사합니다.
   *
   * @example
   * // 입력
   * { username: 'user', Password: 'secret123', AccessToken: 'token123' }
   *
   * // 출력
   * { username: 'user', Password: '[REDACTED]', AccessToken: '[REDACTED]' }
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };
    for (const field of GlobalExceptionFilter.SENSITIVE_FIELDS) {
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

    return GlobalExceptionFilter.SECURITY_SCAN_PATTERNS.some((pattern) =>
      pattern.test(url),
    );
  }
}
