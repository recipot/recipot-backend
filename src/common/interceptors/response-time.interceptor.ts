import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { CustomLoggerService } from '../logger/custom-logger.service';
import { LoggerFactoryService } from '../logger/logger-factory.service';

/**
 * @author 김진태 <reabig4199@gmail.com>
 * @description 응답 반환 시간을 출력하는 인터셉터
 */
@Injectable()
export class ResponseTimeInterceptor implements NestInterceptor {
  private readonly logger: CustomLoggerService;
  constructor(private readonly loggerFactory: LoggerFactoryService) {
    this.logger = this.loggerFactory.create(ResponseTimeInterceptor.name);
  }
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();

    const reqTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const respTime = Date.now();
        const diff = respTime - reqTime;

        this.logger.log(`[${req.method} ${req.path}] ${diff}ms`);
      }),
    );
  }
}
