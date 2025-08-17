import { ERROR_CODES } from '@/common/constants/error-codes';
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './auth.decorators';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // @Public() 데코레이터가 있는 경우에만 인증을 건너뜀
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // 기본적으로 모든 엔드포인트는 인증 필요
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // 에러가 있거나 사용자 정보가 없는 경우
    if (err || !user) {
      throw err || new UnauthorizedException(ERROR_CODES.AUTH_REQUIRED.message);
    }

    // 사용자 정보를 request 객체에 추가
    const request = context.switchToHttp().getRequest();
    request.user = user;

    return user;
  }
}
