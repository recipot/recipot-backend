import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  authenticatedRequest,
  setupMockJwtGuard,
  TEST_TAGS,
  unauthenticatedRequest,
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

  describe('북마크 레시피 관련 테스트', () => {
    const testRecipeId = 2; // 1은 이미 북마크된 상태로 설정되어 있음

    it(`${TEST_TAGS.AUTHENTICATED} /user/bookmark (POST) - 레시피를 북마크한다.`, async () => {
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

      console.log('Response body:', response.body);
      expect(response.body.data.result).toBe(true);
    });

    it(`${TEST_TAGS.AUTHENTICATED} /user/bookmark (POST) - 이미 북마크한 레시피를 다시 북마크할 경우 400 오류 발생`, async () => {
      const createBookmarkDto = {
        recipeId: 1, // 이미 북마크된 상태
      };

      const response = await authenticatedRequest(
        app,
        'post',
        '/v1/user/bookmarks',
      )
        .send(createBookmarkDto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toBe('이미 북마크한 레시피입니다.');
    });

    it(`${TEST_TAGS.AUTHENTICATED} /user/bookmark (POST) - 존재하지 않는 레시피 ID로 북마크할 경우 400 오류 발생`, async () => {
      const createBookmarkDto = {
        recipeId: 99999,
      };

      const response = await authenticatedRequest(
        app,
        'post',
        '/v1/user/bookmarks',
      )
        .send(createBookmarkDto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toBe('레시피를 찾을 수 없습니다.');
    });

    it(`${TEST_TAGS.AUTHENTICATED} /user/bookmarks (GET) - 사용자의 북마크를 날짜별로 조회한다.`, async () => {
      const response = await authenticatedRequest(
        app,
        'get',
        '/v1/user/bookmarks',
      );

      console.log('Response status:', response.status);
      console.log('Response body:', response.body);

      expect(response.status).toBe(HttpStatus.OK);

      expect(Array.isArray(response.body.data)).toBe(true);

      if (response.body.data.length > 0) {
        const groupedBookmark = response.body.data[0];
        expect(groupedBookmark).toHaveProperty('date');
        expect(groupedBookmark).toHaveProperty('bookmarks');
        expect(Array.isArray(groupedBookmark.bookmarks)).toBe(true);

        if (groupedBookmark.bookmarks.length > 0) {
          const bookmark = groupedBookmark.bookmarks[0];
          expect(bookmark).toHaveProperty('id');
          expect(bookmark).toHaveProperty('user_id');
          expect(bookmark).toHaveProperty('recipe_id');
          expect(bookmark).toHaveProperty('recipe_description');
          expect(bookmark).toHaveProperty('recipe_duration');
          expect(bookmark).toHaveProperty('recipe_level');
          expect(bookmark).toHaveProperty('recipe_method');
          expect(bookmark).toHaveProperty('recipe_washing_level');
          expect(bookmark).toHaveProperty('recipe_images');
          expect(bookmark).toHaveProperty('created_at');
        }
      }
    });

    it(`${TEST_TAGS.UNAUTHENTICATED} /user/bookmarks (GET) - 인증되지 않은 사용자가 북마크를 조회할 경우 401 오류 발생`, async () => {
      const response = await unauthenticatedRequest(
        app,
        'get',
        '/v1/user/bookmarks',
      ).expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.message).toBe('인증이 필요합니다.');
    });

    it(`${TEST_TAGS.AUTHENTICATED} /user/bookmarks/:recipeId (DELETE) - 레시피 북마크를 해제한다.`, async () => {
      const recipeId = 2; // 북마크 해제할 레시피 ID

      const response = await authenticatedRequest(
        app,
        'delete',
        `/v1/user/bookmarks/${recipeId}`,
      ).expect(HttpStatus.OK);

      expect(response.body.data.result).toBe(true);
    });

    it(`${TEST_TAGS.AUTHENTICATED} /user/bookmarks/:recipeId (DELETE) - 존재하지 않는 북마크를 해제할 경우 400 오류 발생`, async () => {
      const recipeId = 99999; // 존재하지 않는 북마크 ID

      const response = await authenticatedRequest(
        app,
        'delete',
        `/v1/user/bookmarks/${recipeId}`,
      ).expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toBe('북마크를 찾을 수 없습니다.');
    });
  });

  describe('레시피 요리 시작 관련 테스트', () => {
    const testRecipeId = 4; // 테스트용 레시피 ID

    it(`${TEST_TAGS.AUTHENTICATED} /user/recipes/:recipeId/start (POST) - 레시피 요리를 시작한다.`, async () => {
      const response = await authenticatedRequest(
        app,
        'post',
        `/v1/user/recipes/${testRecipeId}/start`,
      ).expect(HttpStatus.CREATED);

      console.log('Start cooking response:', response.body);
      expect(response.body.data).toBe(true);
    });

    it(`${TEST_TAGS.AUTHENTICATED} /user/recipes/:recipeId/start (POST) - 이미 요리를 시작한 레시피를 다시 시작할 경우 true 반환`, async () => {
      const response = await authenticatedRequest(
        app,
        'post',
        `/v1/user/recipes/${testRecipeId}/start`,
      ).expect(HttpStatus.CREATED);

      console.log('Duplicate start cooking response:', response.body);
      expect(response.body.data).toBe(true);
    });

    it(`${TEST_TAGS.AUTHENTICATED} /user/recipes/:recipeId/start (POST) - 존재하지 않는 레시피 ID로 요리 시작할 경우 404 오류 발생`, async () => {
      const response = await authenticatedRequest(
        app,
        'post',
        '/v1/user/recipes/99999/start',
      ).expect(HttpStatus.NOT_FOUND);

      console.log('Non-existent recipe start cooking response:', response.body);
      expect(response.body.code).toBe('E13002');
      expect(response.body.message).toBe('레시피를 찾을 수 없습니다.');
    });

    it(`${TEST_TAGS.UNAUTHENTICATED} /user/recipes/:recipeId/start (POST) - 인증되지 않은 사용자가 요리 시작할 경우 401 오류 발생`, async () => {
      const response = await unauthenticatedRequest(
        app,
        'post',
        `/v1/user/recipes/${testRecipeId}/start`,
      ).expect(HttpStatus.UNAUTHORIZED);

      console.log('Unauthenticated start cooking response:', response.body);
      expect(response.body.message).toBe('인증이 필요합니다.');
    });
  });

  describe('레시피 완료 관련 테스트', () => {
    const testRecipeId = 3; // 테스트용 레시피 ID

    it(`${TEST_TAGS.AUTHENTICATED} /user/recipes/:recipeId/complete (POST) - 레시피를 완료한다.`, async () => {
      const response = await authenticatedRequest(
        app,
        'post',
        `/v1/user/recipes/${testRecipeId}/complete`,
      ).expect(HttpStatus.CREATED);

      console.log('Complete recipe response:', response.body);
      expect(response.body.data).toBe(true);
    });

    it(`${TEST_TAGS.AUTHENTICATED} /user/recipes/:recipeId/complete (POST) - 이미 완료한 레시피를 다시 완료할 경우 true 반환`, async () => {
      const response = await authenticatedRequest(
        app,
        'post',
        '/v1/user/recipes/3/complete',
      ).expect(HttpStatus.CREATED);

      console.log('Duplicate completion response:', response.body);
      expect(response.body.data).toBe(true);
    });

    it(`${TEST_TAGS.AUTHENTICATED} /user/recipes/:recipeId/complete (POST) - 존재하지 않는 레시피 ID로 완료할 경우 400 오류 발생`, async () => {
      const response = await authenticatedRequest(
        app,
        'post',
        '/v1/user/recipes/99999/complete',
      ).expect(HttpStatus.BAD_REQUEST);

      console.log('Recipe not found error:', response.body);
      expect(response.body.message).toBe('레시피를 찾을 수 없습니다.');
    });

    it(`${TEST_TAGS.AUTHENTICATED} /user/recipes/:recipeId/complete (POST) - 잘못된 레시피 ID로 완료할 경우 400 오류 발생`, async () => {
      const response = await authenticatedRequest(
        app,
        'post',
        '/v1/user/recipes/invalid/complete',
      ).expect(HttpStatus.BAD_REQUEST);

      console.log('Validation error:', response.body);
      expect(response.body.message).toContain('Validation failed');
    });

    it(`${TEST_TAGS.UNAUTHENTICATED} /user/recipes/:recipeId/complete (POST) - 인증되지 않은 사용자가 레시피를 완료할 경우 401 오류 발생`, async () => {
      const response = await unauthenticatedRequest(
        app,
        'post',
        '/v1/user/recipes/3/complete',
      ).expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.message).toBe('인증이 필요합니다.');
    });
  });
});
