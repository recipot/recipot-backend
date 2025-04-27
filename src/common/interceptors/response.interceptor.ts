import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ResponseDto } from '../dto/response.dto';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ResponseDto<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ResponseDto<T>> {
    return next.handle().pipe(
      map((data) => ResponseDto.success(data)), // 성공 응답 래핑
    );
  }
}
