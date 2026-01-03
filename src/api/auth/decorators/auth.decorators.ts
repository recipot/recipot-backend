import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { isUUID } from 'class-validator';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * 헤더에서 X-Guest-Session 값을 추출하는 파라미터 데코레이터
 * 비로그인 사용자 식별용
 * UUID 형식 검증 포함
 */
export const GuestSession = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const sessionId = request.headers['x-guest-session'];

    if (sessionId && !isUUID(sessionId)) {
      throw new BadRequestException('잘못된 게스트 세션 ID 형식입니다.');
    }

    return sessionId;
  },
);
