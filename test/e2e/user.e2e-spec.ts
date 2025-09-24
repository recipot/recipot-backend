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

    it(`${TEST_TAGS.AUTHENTICATED} 2단계: 레시피 요리 시작 - /user/recipes/:recipeId/start (POST)`, async () => {
      const response = await authenticatedRequest(
        app,
        'post',
        `/v1/user/recipes/${testRecipeId}/start`,
      ).expect(HttpStatus.CREATED);

      expect(response.body.data).toBe(true);
    });

    it(`${TEST_TAGS.AUTHENTICATED} 3단계: 레시피 요리 완료 - /user/recipes/:recipeId/complete (POST)`, async () => {
      const response = await authenticatedRequest(
        app,
        'post',
        `/v1/user/recipes/${testRecipeId}/complete`,
      ).expect(HttpStatus.CREATED);

      expect(response.body.data).toBe(true);
    });
  });

  describe('북마크 저장 -> 북마크 조회 -> 북마크 삭제 플로우', () => {
    const testRecipeId = 2; // 테스트용 레시피 ID

    it(`${TEST_TAGS.AUTHENTICATED} 1단계: 레시피 북마크 - /user/bookmarks (POST)`, async () => {
      const createBookmarkDto = {
        recipeId: testRecipeId,
      };

      const response = await authenticatedRequest(
        app,
        'post',
        '/v1/user/bookmarks',
      )
        .send(createBookmarkDto)
        .expect(HttpStatus.CREATED);

      expect(response.body.data.result).toBe(true);
    });

    it(`${TEST_TAGS.AUTHENTICATED} 2단계: 북마크 목록 조회 - /user/bookmarks (GET)`, async () => {
      const response = await authenticatedRequest(
        app,
        'get',
        '/v1/user/bookmarks',
      );

      expect(response.status).toBe(HttpStatus.OK);
      expect(Array.isArray(response.body.data)).toBe(true);

      if (response.body.data.length > 0) {
        const groupedBookmark = response.body.data[0];
        expect(groupedBookmark).toHaveProperty('date');
        expect(groupedBookmark).toHaveProperty('bookmarks');
        expect(Array.isArray(groupedBookmark.bookmarks)).toBe(true);
      }
    });

    it(`${TEST_TAGS.AUTHENTICATED} 3단계: 북마크 해제 - /user/bookmarks/:recipeId (DELETE)`, async () => {
      const response = await authenticatedRequest(
        app,
        'delete',
        `/v1/user/bookmarks/${testRecipeId}`,
      ).expect(HttpStatus.OK);

      expect(response.body.data.result).toBe(true);
    });
  });
});
