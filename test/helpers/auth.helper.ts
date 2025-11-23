import { JwtGuard } from '@/api/auth/guards/auth.guard';
import { UserRole } from '@/api/user/enums/role.enum';
import { User } from '@/database/entity/user.entity';
import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';

export const mockAccessToken = 'mock-jwt-token-for-testing';
export const mockAdminAccessToken = 'mock-admin-jwt-token-for-testing';

// 토큰을 사용자 ID로 매핑
// 일반 토큰은 user1 (ID 1), ADMIN 토큰은 ADMIN 사용자 (ID 2)
// 실제 사용자는 데이터베이스에서 조회하여 role을 가져옵니다.
const getUserIdFromToken = (token: string): number | null => {
  if (token === mockAccessToken) {
    return 1; // user1
  }
  if (token === mockAdminAccessToken) {
    return 2; // ADMIN 사용자
  }
  // 토큰에서 숫자 추출 시도 (예: "user-1" -> 1)
  const match = token.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
};

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
 * ADMIN 권한이 필요한 요청을 위한 헬퍼 함수
 */
export const authenticatedAdminRequest = (
  app: INestApplication,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  url: string,
  token: string = mockAdminAccessToken,
) => {
  return request(app.getHttpServer())
    [method](url)
    .set('Authorization', `Bearer ${token}`);
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
 * 실제 데이터베이스에서 사용자를 조회하여 role을 가져옵니다.
 */
export const createMockJwtGuard = (moduleRef: TestingModule) => ({
  canActivate: async (context) => {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // 인증 헤더가 없으면 401 Unauthorized 예외 발생
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('인증이 필요합니다.');
    }

    // UserRepository 가져오기
    const userRepository = moduleRef.get<Repository<User>>(
      getRepositoryToken(User),
    );

    // 토큰 추출
    const token = authHeader.replace('Bearer ', '');

    let user: User | null = null;

    // ADMIN 토큰인 경우 ADMIN role을 가진 사용자 조회
    if (token === mockAdminAccessToken) {
      user = await userRepository.findOne({
        where: { role: UserRole.ADMIN },
      });
    } else {
      // 일반 토큰인 경우 사용자 ID로 조회
      const userId = getUserIdFromToken(token);
      if (!userId) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      }
      user = await userRepository.findOne({
        where: { id: userId },
      });
    }

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    // request.user에 사용자 정보 설정
    request.user = {
      sub: user.id,
      email: user.email,
      username: user.nickname,
      role: user.role,
    };

    return true;
  },
});

// 전역 변수로 모듈 인스턴스를 저장 (가드에서 접근하기 위해)
let currentModuleRef: TestingModule | null = null;

/**
 * 테스트 모듈에 JWT 가드 모킹을 적용하는 헬퍼 함수
 * 모듈을 컴파일한 후 UserRepository를 가져와서 실제 사용자 조회가 가능하도록 합니다.
 */
export const setupMockJwtGuard = async (
  moduleBuilder: any,
): Promise<TestingModule> => {
  // 가드를 생성하는 팩토리 함수 (나중에 모듈 인스턴스를 사용)
  const guardFactory = () => ({
    canActivate: async (context: any) => {
      if (!currentModuleRef) {
        throw new Error('Module reference not available');
      }

      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers.authorization;

      // 인증 헤더가 없으면 401 Unauthorized 예외 발생
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('인증이 필요합니다.');
      }

      // UserRepository 가져오기
      const userRepository = currentModuleRef.get<Repository<User>>(
        getRepositoryToken(User),
      );

      // 토큰 추출
      const token = authHeader.replace('Bearer ', '');

      let user: User | null = null;

      // ADMIN 토큰인 경우 ADMIN role을 가진 사용자 조회
      if (token === mockAdminAccessToken) {
        user = await userRepository.findOne({
          where: { role: UserRole.ADMIN },
        });
      } else {
        // 일반 토큰인 경우 사용자 ID로 조회
        const userId = getUserIdFromToken(token);
        if (!userId) {
          throw new UnauthorizedException('유효하지 않은 토큰입니다.');
        }
        user = await userRepository.findOne({
          where: { id: userId },
        });
      }

      if (!user) {
        throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
      }

      // request.user에 사용자 정보 설정
      request.user = {
        sub: user.id,
        email: user.email,
        username: user.nickname,
        role: user.role,
      };

      return true;
    },
  });

  // 모듈 빌더에 가드 오버라이드 설정
  const moduleBuilderWithGuard = moduleBuilder
    .overrideGuard(JwtGuard)
    .useValue(guardFactory());

  // 모듈 컴파일
  const moduleFixture = await moduleBuilderWithGuard.compile();

  // 전역 변수에 모듈 인스턴스 저장 (가드에서 접근하기 위해)
  currentModuleRef = moduleFixture;

  return moduleFixture;
};
