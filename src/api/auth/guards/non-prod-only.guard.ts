import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class NonProdOnlyGuard implements CanActivate {
  // TODO 추후 고도화 시에 사용 예정
  canActivate(context: ExecutionContext): boolean {
    // 비프로덕션은 항상 허용
    if (process.env.NODE_ENV !== 'production') {
      return true;
    }

    // 프로덕션 기본 차단, 단 임시 허용 옵션 지원
    const enabled =
      (process.env.DEBUG_TOKEN_ENABLED || '').toLowerCase() === 'true';
    if (!enabled) {
      throw new NotFoundException();
    }

    // 시그널 헤더 검증으로 제한적 허용
    const request = context.switchToHttp().getRequest();
    const provided = request.headers['x-debug-auth'] as string | undefined;
    const secret = process.env.DEBUG_TOKEN_SECRET;

    if (!secret || !provided || provided !== secret) {
      throw new NotFoundException();
    }

    return true;
  }
}
