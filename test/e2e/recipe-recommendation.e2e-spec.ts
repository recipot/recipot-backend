import { AppModule } from '@/app.module';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { initializeTransactionalContext } from 'typeorm-transactional';
import {
  authenticatedRequest,
  setupMockJwtGuard,
  TEST_TAGS,
} from '../helpers/auth.helper';

describe('RecipeRecommendation (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // typeorm-transactional 초기화
    initializeTransactionalContext();

    const moduleBuilder = Test.createTestingModule({
      imports: [AppModule],
    });

    const moduleFixture: TestingModule =
      await setupMockJwtGuard(moduleBuilder).compile();

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
    if (app) {
      await app.close();
    }
  });

  describe('기본 추천 조회', () => {
    it(`${TEST_TAGS.AUTHENTICATED} 정상 요청`, async () => {
      const response = await authenticatedRequest(
        app,
        'post',
        '/v1/recipes/recommendations',
      )
        .send({
          conditionId: 1,
          pantryIds: [1, 2, 3],
          page: 1,
          pageSize: 3,
        })
        .expect(HttpStatus.CREATED);

      // ResponseInterceptor로 래핑됨
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('currentPage', 1);
      expect(response.body.data).toHaveProperty('pageSize', 3);
      expect(response.body.data).toHaveProperty('totalItems');
      expect(response.body.data).toHaveProperty('totalPages');
      expect(response.body.data).toHaveProperty('hasNextPage');
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });

    it(`${TEST_TAGS.AUTHENTICATED} 필수 파라미터 없으면 400 에러`, async () => {
      await authenticatedRequest(app, 'post', '/v1/recipes/recommendations')
        .send({ pantryIds: [1, 2, 3] }) // conditionId 없음
        .expect(HttpStatus.BAD_REQUEST);
    });

    it(`${TEST_TAGS.AUTHENTICATED} pantryIds가 배열이 아니면 400 에러`, async () => {
      await authenticatedRequest(app, 'post', '/v1/recipes/recommendations')
        .send({ conditionId: 1, pantryIds: 'invalid' })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('캐시 동작', () => {
    it(`${TEST_TAGS.AUTHENTICATED} 첫 요청 캐시 미스, 두 번째 요청 캐시 히트`, async () => {
      // 캐시 무효화 (ADMIN 권한 필요하므로 스킵)
      // await authenticatedRequest(
      //   app,
      //   'post',
      //   '/v1/recipes/recommendations/cache/invalidate',
      // ).expect(HttpStatus.CREATED);

      const requestDto = {
        conditionId: 1,
        pantryIds: [10, 20, 30],
        page: 1,
        pageSize: 3,
      };

      // 첫 요청
      const response1 = await authenticatedRequest(
        app,
        'post',
        '/v1/recipes/recommendations',
      )
        .send(requestDto)
        .expect(HttpStatus.CREATED);

      // 두 번째 요청 (캐시 히트)
      const response2 = await authenticatedRequest(
        app,
        'post',
        '/v1/recipes/recommendations',
      )
        .send(requestDto)
        .expect(HttpStatus.CREATED);

      // 동일한 결과 반환
      expect(response1.body.data.items).toEqual(response2.body.data.items);
      expect(response1.body.data.totalItems).toBe(
        response2.body.data.totalItems,
      );
    });

    it(`${TEST_TAGS.AUTHENTICATED} 다른 pantryIds는 다른 캐시 키`, async () => {
      const response1 = await authenticatedRequest(
        app,
        'post',
        '/v1/recipes/recommendations',
      )
        .send({ conditionId: 1, pantryIds: [1, 2], page: 1, pageSize: 3 })
        .expect(HttpStatus.CREATED);

      const response2 = await authenticatedRequest(
        app,
        'post',
        '/v1/recipes/recommendations',
      )
        .send({ conditionId: 1, pantryIds: [3, 4], page: 1, pageSize: 3 })
        .expect(HttpStatus.CREATED);

      // 둘 다 성공
      expect(response1.body.data.items).toBeDefined();
      expect(response2.body.data.items).toBeDefined();
    });
  });

  describe('페이지네이션', () => {
    it(`${TEST_TAGS.AUTHENTICATED} 첫 페이지와 두 번째 페이지`, async () => {
      const page1 = await authenticatedRequest(
        app,
        'post',
        '/v1/recipes/recommendations',
      )
        .send({ conditionId: 1, pantryIds: [1, 2], page: 1, pageSize: 2 })
        .expect(HttpStatus.CREATED);

      const page2 = await authenticatedRequest(
        app,
        'post',
        '/v1/recipes/recommendations',
      )
        .send({ conditionId: 1, pantryIds: [1, 2], page: 2, pageSize: 2 })
        .expect(HttpStatus.CREATED);

      expect(page1.body.data.currentPage).toBe(1);
      expect(page2.body.data.currentPage).toBe(2);
      expect(page1.body.data.items.length).toBeLessThanOrEqual(2);
      expect(page2.body.data.items.length).toBeLessThanOrEqual(2);

      // 총 아이템 수는 동일
      expect(page1.body.data.totalItems).toBe(page2.body.data.totalItems);
    });

    it(`${TEST_TAGS.AUTHENTICATED} 존재하지 않는 페이지는 빈 배열`, async () => {
      const response = await authenticatedRequest(
        app,
        'post',
        '/v1/recipes/recommendations',
      )
        .send({ conditionId: 1, pantryIds: [1], page: 999, pageSize: 3 })
        .expect(HttpStatus.CREATED);

      expect(response.body.data.items).toEqual([]);
      expect(response.body.data.currentPage).toBe(999);
      expect(response.body.data.hasNextPage).toBe(false);
    });

    it(`${TEST_TAGS.AUTHENTICATED} page가 0 이하면 400 에러`, async () => {
      await authenticatedRequest(app, 'post', '/v1/recipes/recommendations')
        .send({ conditionId: 1, pantryIds: [1], page: 0, pageSize: 3 })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('캐시 무효화', () => {
    // ADMIN 권한이 필요하므로 스킵
    it.skip(`${TEST_TAGS.AUTHENTICATED} 전체 캐시 무효화`, async () => {
      // 추천 조회로 캐시 생성
      await authenticatedRequest(app, 'post', '/v1/recipes/recommendations')
        .send({ conditionId: 1, pantryIds: [1, 2, 3], page: 1, pageSize: 3 })
        .expect(HttpStatus.CREATED);

      // 전체 캐시 무효화 (ADMIN 권한 필요)
      const response = await authenticatedRequest(
        app,
        'post',
        '/v1/recipes/recommendations/cache/invalidate',
      ).expect(HttpStatus.CREATED);

      expect(response.body.data.message).toContain('캐시 무효화 완료');
    });

    it.skip(`${TEST_TAGS.AUTHENTICATED} 특정 조건만 캐시 무효화`, async () => {
      // 조건 1과 2에 대한 캐시 생성
      await authenticatedRequest(app, 'post', '/v1/recipes/recommendations')
        .send({ conditionId: 1, pantryIds: [1], page: 1, pageSize: 3 })
        .expect(HttpStatus.CREATED);

      await authenticatedRequest(app, 'post', '/v1/recipes/recommendations')
        .send({ conditionId: 2, pantryIds: [1], page: 1, pageSize: 3 })
        .expect(HttpStatus.CREATED);

      // 조건 1만 무효화 (ADMIN 권한 필요)
      const response = await authenticatedRequest(
        app,
        'post',
        '/v1/recipes/recommendations/cache/invalidate/1',
      ).expect(HttpStatus.CREATED);

      expect(response.body.data.message).toContain('조건 1');
    });
  });

  describe('동시 요청', () => {
    it(`${TEST_TAGS.AUTHENTICATED} 동일한 조건으로 동시 요청 시 모두 동일한 결과`, async () => {
      const requestDto = {
        conditionId: 5,
        pantryIds: [1, 2, 3, 4, 5],
        page: 1,
        pageSize: 3,
      };

      // 동시에 3개 요청
      const promises = Array(3)
        .fill(null)
        .map(() =>
          authenticatedRequest(app, 'post', '/v1/recipes/recommendations')
            .send(requestDto)
            .expect(HttpStatus.CREATED),
        );

      const responses = await Promise.all(promises);

      // 모든 응답이 동일
      const firstResult = responses[0].body.data;
      responses.forEach((response) => {
        expect(response.body.data.items).toEqual(firstResult.items);
        expect(response.body.data.totalItems).toBe(firstResult.totalItems);
      });
    });
  });
});
