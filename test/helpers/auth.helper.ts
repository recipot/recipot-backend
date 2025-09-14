import { JwtGuard } from '@/api/auth/guards/auth.guard';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export const mockAccessToken = 'mock-jwt-token-for-testing';

/**
 * 인증이 필요한 요청을 위한 헬퍼 함수
 */
export const authenticatedRequest = (
  app: INestApplication,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  url: string,
  token: string = mockAccessToken,
) => {
  return request(app.getHttpServer())
    [method](url)
    .set('Authorization', `Bearer ${token}`);
};

/**
 * 인증이 필요 없는 요청을 위한 헬퍼 함수
 */
export const unauthenticatedRequest = (
  app: INestApplication,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  url: string,
) => {
  return request(app.getHttpServer())[method](url);
};

/**
 * 테스트 태그를 위한 상수
 */
export const TEST_TAGS = {
  AUTHENTICATED: '@authenticated',
  UNAUTHENTICATED: '@unauthenticated',
  PUBLIC: '@public',
} as const;

/**
 * 테스트용 JWT 가드 모킹 함수
 * 모든 E2E 테스트에서 공통으로 사용
 */
export const createMockJwtGuard = () => ({
  canActivate: (context) => {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // 인증 헤더가 없으면 false 반환 (403 Forbidden)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    // 인증 헤더가 있으면 mock user 설정
    request.user = {
      sub: 1,
      email: 'test@example.com',
      username: 'testuser',
    };
    return true;
  },
});

/**
 * 테스트 모듈에 JWT 가드 모킹을 적용하는 헬퍼 함수
 */
export const setupMockJwtGuard = (moduleBuilder: any) => {
  return moduleBuilder.overrideGuard(JwtGuard).useValue(createMockJwtGuard());
};
