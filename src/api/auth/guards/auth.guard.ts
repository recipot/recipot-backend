import { ERROR_CODES } from '@/common/constants/error-codes';
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/auth.decorators';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // @Public() 데코레이터가 있는 경우
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // Public 엔드포인트여도 토큰이 있으면 파싱 시도 (Optional Auth)
      // 실패해도 에러 던지지 않고 통과
      const request = context.switchToHttp().getRequest();
      request.isPublicRoute = true; // handleRequest에서 참조

      try {
        await super.canActivate(context);
      } catch {
        // 토큰 없거나 유효하지 않아도 통과
      }
      return true;
    }

    // 기본적으로 모든 엔드포인트는 인증 필요
    return super.canActivate(context) as Promise<boolean>;
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    // Public 라우트에서는 인증 실패해도 에러 던지지 않음
    if (request.isPublicRoute) {
      if (user) {
        request.user = user;
      }
      return user;
    }

    // 에러가 있거나 사용자 정보가 없는 경우
    if (err || !user) {
      throw err || new UnauthorizedException(ERROR_CODES.AUTH_REQUIRED.message);
    }

    // 사용자 정보를 request 객체에 추가
    request.user = user;

    return user;
  }
}
