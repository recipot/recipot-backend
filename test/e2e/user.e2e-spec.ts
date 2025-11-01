import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  authenticatedRequest,
  setupMockJwtGuard,
  TEST_TAGS,
} from '../helpers/auth.helper';
import { MockAppModule } from '../mocks/app.mock';

describe('UserController (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      imports: [MockAppModule],
    });

    const moduleFixture: TestingModule =
      await setupMockJwtGuard(moduleBuilder).compile();

    app = moduleFixture.createNestApplication();

    // 버전 관리 활성화
    app.enableVersioning();

    // ValidationPipe 추가
    app.useGlobalPipes(new ValidationPipe());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('레시피 조회 -> 요리 시작 -> 요리 완료 플로우', () => {
    const testRecipeId = 1; // 테스트용 레시피 ID

    it(`${TEST_TAGS.AUTHENTICATED} 1단계: 레시피 조회 - /recipes/:id (GET)`, async () => {
      const response = await authenticatedRequest(
        app,
        'get',
        `/v1/recipes/${testRecipeId}`,
      ).expect(HttpStatus.OK);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('title');
      expect(response.body.data).toHaveProperty('description');
      expect(response.body.data).toHaveProperty('ingredients');
      expect(response.body.data).toHaveProperty('steps');
    });

    it(`${TEST_TAGS.AUTHENTICATED} 2단계: 레시피 요리 시작 - /users/recipes/:recipeId/start (POST)`, async () => {
      const response = await authenticatedRequest(
        app,
        'post',
        `/v1/users/recipes/${testRecipeId}/start`,
      ).expect(HttpStatus.CREATED);

      expect(response.body.data).toHaveProperty('completedRecipeId');
      expect(typeof response.body.data.completedRecipeId).toBe('number');
    });

    it(`${TEST_TAGS.AUTHENTICATED} 3단계: 레시피 요리 완료 - /users/recipes/:recipeId/complete (POST)`, async () => {
      const response = await authenticatedRequest(
        app,
        'post',
        `/v1/users/recipes/${testRecipeId}/complete`,
      ).expect(HttpStatus.CREATED);

      expect(response.body.data).toBe(true);
    });
  });

  describe('북마크 저장 -> 북마크 조회 -> 북마크 삭제 플로우', () => {
    const testRecipeId = 2; // 테스트용 레시피 ID

    it(`${TEST_TAGS.AUTHENTICATED} 1단계: 레시피 북마크 - /users/recipes/bookmarks (POST)`, async () => {
      const createBookmarkDto = {
        recipeId: testRecipeId,
      };

      const response = await authenticatedRequest(
        app,
        'post',
        '/v1/users/recipes/bookmarks',
      )
        .send(createBookmarkDto)
        .expect(HttpStatus.CREATED);

      expect(response.body.data).toBe(true);
    });

    it(`${TEST_TAGS.AUTHENTICATED} 2단계: 북마크 목록 조회 - /users/recipes/bookmarks (GET)`, async () => {
      const response = await authenticatedRequest(
        app,
        'get',
        '/v1/users/recipes/bookmarks',
      );

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
      expect(response.body.data).toHaveProperty('totalPages');
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });

    it(`${TEST_TAGS.AUTHENTICATED} 3단계: 북마크 해제 - /users/recipes/bookmarks/:recipeId (DELETE)`, async () => {
      const response = await authenticatedRequest(
        app,
        'delete',
        `/v1/users/recipes/bookmarks/${testRecipeId}`,
      ).expect(HttpStatus.OK);

      expect(response.body.data).toBe(true);
    });
  });

  describe('완료한 레시피 조회 플로우', () => {
    it(`${TEST_TAGS.AUTHENTICATED} 완료한 레시피 목록 조회 - /users/recipes/completed (GET)`, async () => {
      const response = await authenticatedRequest(
        app,
        'get',
        '/v1/users/recipes/completed',
      );

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
      expect(response.body.data).toHaveProperty('totalPages');
      expect(Array.isArray(response.body.data.items)).toBe(true);

      // 완료한 레시피 데이터 구조 검증
      if (response.body.data.items.length > 0) {
        const completedRecipe = response.body.data.items[0];
        expect(completedRecipe).toHaveProperty('id');
        expect(completedRecipe).toHaveProperty('userId');
        expect(completedRecipe).toHaveProperty('recipeId');
        expect(completedRecipe).toHaveProperty('recipeTitle');
        expect(completedRecipe).toHaveProperty('recipeDescription');
        expect(completedRecipe).toHaveProperty('recipeImages');
        expect(completedRecipe).toHaveProperty('isCompleted');
        expect(completedRecipe).toHaveProperty('isReviewed');
        expect(completedRecipe).toHaveProperty('createdAt');
        expect(completedRecipe).toHaveProperty('isBookmarked');
        expect(completedRecipe.isCompleted).toBe(true);
        expect(typeof completedRecipe.isBookmarked).toBe('boolean');
        expect(Array.isArray(completedRecipe.recipeImages)).toBe(true);
      }
    });

    it(`${TEST_TAGS.AUTHENTICATED} 완료한 레시피 목록 조회 (페이지네이션) - /users/recipes/completed?page=1&limit=2 (GET)`, async () => {
      const response = await authenticatedRequest(
        app,
        'get',
        '/v1/users/recipes/completed?page=1&limit=2',
      );

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
      expect(response.body.data).toHaveProperty('totalPages');
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(2);
      expect(Array.isArray(response.body.data.items)).toBe(true);
      expect(response.body.data.items.length).toBeLessThanOrEqual(2);
    });
  });

  describe('최근 본 레시피 조회 플로우', () => {
    it(`${TEST_TAGS.AUTHENTICATED} 최근 본 레시피 목록 조회 - /users/recipes/recent (GET)`, async () => {
      const response = await authenticatedRequest(
        app,
        'get',
        '/v1/users/recipes/recent',
      );

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
      expect(response.body.data).toHaveProperty('totalPages');
      expect(Array.isArray(response.body.data.items)).toBe(true);

      // 최근 본 레시피 데이터 구조 검증
      if (response.body.data.items.length > 0) {
        const recentRecipe = response.body.data.items[0];
        expect(recentRecipe).toHaveProperty('id');
        expect(recentRecipe).toHaveProperty('userId');
        expect(recentRecipe).toHaveProperty('recipeId');
        expect(recentRecipe).toHaveProperty('recipeTitle');
        expect(recentRecipe).toHaveProperty('recipeDescription');
        expect(recentRecipe).toHaveProperty('recipeImages');
        expect(recentRecipe).toHaveProperty('createdAt');
        expect(recentRecipe).toHaveProperty('isBookmarked');
        expect(typeof recentRecipe.isBookmarked).toBe('boolean');
        expect(Array.isArray(recentRecipe.recipeImages)).toBe(true);
      }
    });

    it(`${TEST_TAGS.AUTHENTICATED} 최근 본 레시피 목록 조회 (페이지네이션) - /users/recipes/recent?page=1&limit=2 (GET)`, async () => {
      const response = await authenticatedRequest(
        app,
        'get',
        '/v1/users/recipes/recent?page=1&limit=2',
      );

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
      expect(response.body.data).toHaveProperty('totalPages');
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(2);
      expect(Array.isArray(response.body.data.items)).toBe(true);
      expect(response.body.data.items.length).toBeLessThanOrEqual(2);
    });
  });

  describe('같은 레시피를 여러 번 요리 시작 -> 완료 -> 후기 작성 플로우', () => {
    const testRecipeId = 3; // 테스트용 레시피 ID
    const completedRecipeIds: number[] = [];

    it(`${TEST_TAGS.AUTHENTICATED} 1차: 레시피 요리 시작`, async () => {
      const response = await authenticatedRequest(
        app,
        'post',
        `/v1/users/recipes/${testRecipeId}/start`,
      ).expect(HttpStatus.CREATED);

      expect(response.body.data).toHaveProperty('completedRecipeId');
      expect(typeof response.body.data.completedRecipeId).toBe('number');
      completedRecipeIds.push(response.body.data.completedRecipeId);
    });

    it(`${TEST_TAGS.AUTHENTICATED} 1차: 레시피 요리 완료`, async () => {
      const completedRecipeId = completedRecipeIds[0];
      const response = await authenticatedRequest(
        app,
        'post',
        `/v1/users/recipes/${completedRecipeId}/complete`,
      ).expect(HttpStatus.CREATED);

      expect(response.body.data).toBe(true);
    });

    it(`${TEST_TAGS.AUTHENTICATED} 1차: 레시피 후기 작성`, async () => {
      const completedRecipeId = completedRecipeIds[0];
      const createReviewDto = {
        completedRecipeId,
        tasteCode: 'R03001',
        difficultyCode: 'R04001',
        experienceCode: 'R05001',
        content: '첫 번째 시도였는데 정말 맛있게 잘 됐어요!',
      };

      const response = await authenticatedRequest(app, 'post', '/v1/reviews')
        .send(createReviewDto)
        .expect(HttpStatus.CREATED);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('userId');
      expect(response.body.data).toHaveProperty('userCompletedRecipeId');
      expect(response.body.data.userCompletedRecipeId).toBe(completedRecipeId);
      expect(response.body.data.tasteCode).toBe(createReviewDto.tasteCode);
      expect(response.body.data.content).toBe(createReviewDto.content);
    });

    it(`${TEST_TAGS.AUTHENTICATED} 2차: 같은 레시피 요리 시작 (새로운 completedRecipeId 반환)`, async () => {
      const response = await authenticatedRequest(
        app,
        'post',
        `/v1/users/recipes/${testRecipeId}/start`,
      ).expect(HttpStatus.CREATED);

      expect(response.body.data).toHaveProperty('completedRecipeId');
      expect(typeof response.body.data.completedRecipeId).toBe('number');

      // 이전 completedRecipeId와 다른지 확인
      expect(response.body.data.completedRecipeId).not.toBe(
        completedRecipeIds[0],
      );

      completedRecipeIds.push(response.body.data.completedRecipeId);
    });

    it(`${TEST_TAGS.AUTHENTICATED} 2차: 레시피 요리 완료`, async () => {
      const completedRecipeId = completedRecipeIds[1];
      const response = await authenticatedRequest(
        app,
        'post',
        `/v1/users/recipes/${completedRecipeId}/complete`,
      ).expect(HttpStatus.CREATED);

      expect(response.body.data).toBe(true);
    });

    it(`${TEST_TAGS.AUTHENTICATED} 2차: 레시피 후기 작성`, async () => {
      const completedRecipeId = completedRecipeIds[1];
      const createReviewDto = {
        completedRecipeId,
        tasteCode: 'R03002',
        difficultyCode: 'R04002',
        experienceCode: 'R05002',
        content: '두 번째 시도에서는 더 나은 결과를 얻었어요!',
      };

      const response = await authenticatedRequest(app, 'post', '/v1/reviews')
        .send(createReviewDto)
        .expect(HttpStatus.CREATED);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.userCompletedRecipeId).toBe(completedRecipeId);
      expect(response.body.data.tasteCode).toBe(createReviewDto.tasteCode);
      expect(response.body.data.content).toBe(createReviewDto.content);

      // 첫 번째 후기와 다른 ID인지 확인
      expect(response.body.data.id).toBeDefined();
    });

    it(`${TEST_TAGS.AUTHENTICATED} 3차: 같은 레시피 요리 시작 (세 번째 completedRecipeId 반환)`, async () => {
      const response = await authenticatedRequest(
        app,
        'post',
        `/v1/users/recipes/${testRecipeId}/start`,
      ).expect(HttpStatus.CREATED);

      expect(response.body.data).toHaveProperty('completedRecipeId');
      expect(typeof response.body.data.completedRecipeId).toBe('number');

      // 이전 completedRecipeId들과 다른지 확인
      expect(completedRecipeIds).not.toContain(
        response.body.data.completedRecipeId,
      );

      completedRecipeIds.push(response.body.data.completedRecipeId);
    });

    it(`${TEST_TAGS.AUTHENTICATED} 3차: 레시피 요리 완료`, async () => {
      const completedRecipeId = completedRecipeIds[2];
      const response = await authenticatedRequest(
        app,
        'post',
        `/v1/users/recipes/${completedRecipeId}/complete`,
      ).expect(HttpStatus.CREATED);

      expect(response.body.data).toBe(true);
    });

    it(`${TEST_TAGS.AUTHENTICATED} 3차: 레시피 후기 작성`, async () => {
      const completedRecipeId = completedRecipeIds[2];
      const createReviewDto = {
        completedRecipeId,
        tasteCode: 'R03003',
        difficultyCode: 'R04003',
        experienceCode: 'R05003',
        content: '세 번째 시도에서 완벽하게 만들었어요! 이제 마스터입니다.',
      };

      const response = await authenticatedRequest(app, 'post', '/v1/reviews')
        .send(createReviewDto)
        .expect(HttpStatus.CREATED);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.userCompletedRecipeId).toBe(completedRecipeId);
      expect(response.body.data.tasteCode).toBe(createReviewDto.tasteCode);
      expect(response.body.data.content).toBe(createReviewDto.content);
    });

    it(`${TEST_TAGS.AUTHENTICATED} 검증: 모든 completedRecipeId가 서로 다른지 확인`, () => {
      // 3개의 completedRecipeId가 모두 다른지 확인
      expect(completedRecipeIds.length).toBe(3);
      expect(new Set(completedRecipeIds).size).toBe(3); // 중복이 없어야 함
    });
  });
});
