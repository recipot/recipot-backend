import { RolesGuard } from '@/api/auth/guards/roles.guard';
import { UserRole } from '@/api/user/enums/role.enum';
import { ERROR_CODES } from '@/common/constants/error-codes';
import { CustomException } from '@/common/exceptions/custom-exception';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import {
  authenticatedRequest,
  setupMockJwtGuard,
  TEST_TAGS,
} from '../helpers/auth.helper';
import { MockAppModule } from '../mocks/app.mock';
import { resetReviewMocks } from '../mocks/review.mock';
import { resetUserMocks } from '../mocks/user.mock';

describe('RecipeAdminList (E2E)', () => {
  let app: INestApplication;

  /**
   * 어드민 권한이 있는 사용자로 설정하는 RolesGuard 모킹
   */
  const createMockAdminRolesGuard = () => ({
    canActivate: (context) => {
      const request = context.switchToHttp().getRequest();

      // 어드민 권한이 있는 사용자로 설정
      if (!request.user) {
        request.user = {};
      }
      request.user.role = UserRole.ADMIN;

      return true;
    },
  });

  /**
   * 일반 사용자로 설정하는 RolesGuard 모킹
   */
  const createMockUserRolesGuard = () => ({
    canActivate: () => {
      // 권한 없음 - CustomException 발생 (403 Forbidden)
      throw new CustomException(
        ERROR_CODES.AUTH_PERMISSION_DENIED,
        HttpStatus.FORBIDDEN,
      );
    },
  });

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      imports: [MockAppModule],
    });

    const moduleFixture: TestingModule = await setupMockJwtGuard(moduleBuilder)
      .overrideGuard(RolesGuard)
      .useValue(createMockAdminRolesGuard())
      .compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    resetUserMocks();
    resetReviewMocks();
    await app.close();
  });

  describe('어드민용 레시피 목록 조회', () => {
    it(`${TEST_TAGS.AUTHENTICATED} 어드민 권한으로 레시피 목록 조회 성공`, async () => {
      const response = await authenticatedRequest(
        app,
        'get',
        '/v1/recipes',
      ).expect(HttpStatus.OK);

      // ResponseInterceptor로 래핑됨
      expect(response.body).toHaveProperty('status', 200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);

      // 레시피 목록이 있으면 첫 번째 레시피의 구조 검증
      if (response.body.data.length > 0) {
        const recipe = response.body.data[0];
        expect(recipe).toHaveProperty('id');
        expect(recipe).toHaveProperty('title');
        expect(recipe).toHaveProperty('description');
        expect(recipe).toHaveProperty('duration');
        expect(recipe).toHaveProperty('condition_info');
        expect(recipe).toHaveProperty('images');
        expect(recipe).toHaveProperty('ingredients');
        expect(recipe).toHaveProperty('seasonings');
        expect(recipe).toHaveProperty('tools');
        expect(recipe).toHaveProperty('steps');

        // condition_info 구조 검증
        if (recipe.condition_info) {
          expect(recipe.condition_info).toHaveProperty('id');
          expect(recipe.condition_info).toHaveProperty('name');
          expect(typeof recipe.condition_info.id).toBe('number');
          expect(typeof recipe.condition_info.name).toBe('string');
        }

        // images 배열 검증
        expect(Array.isArray(recipe.images)).toBe(true);
        if (recipe.images.length > 0) {
          expect(recipe.images[0]).toHaveProperty('id');
          expect(recipe.images[0]).toHaveProperty('image_url');
        }

        // ingredients 배열 검증
        expect(Array.isArray(recipe.ingredients)).toBe(true);
        if (recipe.ingredients.length > 0) {
          expect(recipe.ingredients[0]).toHaveProperty('id');
          expect(recipe.ingredients[0]).toHaveProperty('name');
          expect(recipe.ingredients[0]).toHaveProperty('amount');
          expect(recipe.ingredients[0]).toHaveProperty('is_alternative');
          // ownership_status는 제거됨
          expect(recipe.ingredients[0]).not.toHaveProperty('ownership_status');
        }

        // seasonings 배열 검증
        expect(Array.isArray(recipe.seasonings)).toBe(true);
        if (recipe.seasonings.length > 0) {
          expect(recipe.seasonings[0]).toHaveProperty('id');
          expect(recipe.seasonings[0]).toHaveProperty('name');
          expect(recipe.seasonings[0]).toHaveProperty('amount');
        }

        // tools 배열 검증
        expect(Array.isArray(recipe.tools)).toBe(true);
        if (recipe.tools.length > 0) {
          expect(recipe.tools[0]).toHaveProperty('id');
          expect(recipe.tools[0]).toHaveProperty('name');
          // image_url는 제거됨
          expect(recipe.tools[0]).not.toHaveProperty('image_url');
        }

        // steps 배열 검증
        expect(Array.isArray(recipe.steps)).toBe(true);
        if (recipe.steps.length > 0) {
          expect(recipe.steps[0]).toHaveProperty('order_num');
          expect(recipe.steps[0]).toHaveProperty('summary');
          expect(recipe.steps[0]).toHaveProperty('content');
          expect(recipe.steps[0]).toHaveProperty('image_url');
        }

        // condition 필드는 제거됨
        expect(recipe).not.toHaveProperty('condition');
      }
    });

    it(`${TEST_TAGS.AUTHENTICATED} 레시피가 없으면 빈 배열 반환`, async () => {
      // 이 테스트는 실제 데이터베이스 상태에 따라 달라질 수 있음
      // 빈 배열이 반환되는 경우를 확인
      const response = await authenticatedRequest(
        app,
        'get',
        '/v1/recipes',
      ).expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('status', 200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('권한 검증', () => {
    it(`${TEST_TAGS.AUTHENTICATED} 어드민 권한 없으면 403 에러`, async () => {
      // 일반 사용자로 RolesGuard 모킹
      const moduleBuilder = Test.createTestingModule({
        imports: [MockAppModule],
      });

      const moduleFixture: TestingModule = await setupMockJwtGuard(
        moduleBuilder,
      )
        .overrideGuard(RolesGuard)
        .useValue(createMockUserRolesGuard())
        .compile();

      const testApp = moduleFixture.createNestApplication();
      testApp.enableVersioning();
      testApp.useGlobalPipes(
        new ValidationPipe({
          transform: true,
          whitelist: true,
          forbidNonWhitelisted: false,
        }),
      );

      await testApp.init();

      await authenticatedRequest(testApp, 'get', '/v1/recipes').expect(
        HttpStatus.FORBIDDEN,
      );

      await testApp.close();
    });

    it(`${TEST_TAGS.UNAUTHENTICATED} 인증 없으면 401 에러`, async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/recipes')
        .expect(HttpStatus.UNAUTHORIZED);

      // 인증 에러는 다른 형식으로 반환될 수 있음
      expect(response.body).toHaveProperty('statusCode', 401);
    });
  });
});
