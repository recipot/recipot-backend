import { HttpStatus, INestApplication } from '@nestjs/common';
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

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('북마크 레시피 관련 테스트', () => {
    const testRecipeId = 2; // 1은 이미 북마크된 상태로 설정되어 있음

    it(`${TEST_TAGS.AUTHENTICATED} /user/bookmark (POST) - 레시피를 북마크한다.`, async () => {
      const createBookmarkDto = {
        recipe_id: testRecipeId,
      };

      const response = await authenticatedRequest(
        app,
        'post',
        '/v1/user/bookmarks',
      )
        .send(createBookmarkDto)
        .expect(HttpStatus.CREATED);

      console.log('Response body:', response.body);
      expect(response.body.data).toBe(true);
    });

    it(`${TEST_TAGS.AUTHENTICATED} /user/bookmark (POST) - 이미 북마크한 레시피를 다시 북마크할 경우 400 오류 발생`, async () => {
      const createBookmarkDto = {
        recipe_id: 1, // 이미 북마크된 상태
      };

      const response = await authenticatedRequest(
        app,
        'post',
        '/v1/user/bookmarks',
      )
        .send(createBookmarkDto)
        .expect(HttpStatus.BAD_REQUEST);

      console.log('Error response body:', response.body);
      expect(response.body.message).toBe('이미 북마크한 레시피입니다.');
    });

    it(`${TEST_TAGS.AUTHENTICATED} /user/bookmark (POST) - 존재하지 않는 레시피 ID로 북마크할 경우 400 오류 발생`, async () => {
      const createBookmarkDto = {
        recipe_id: 99999,
      };

      const response = await authenticatedRequest(
        app,
        'post',
        '/v1/user/bookmarks',
      )
        .send(createBookmarkDto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toBe('사용자를 찾을 수 없습니다.');
    });

    it(`${TEST_TAGS.AUTHENTICATED} /user/bookmarks (GET) - 사용자의 북마크를 페이지네이션으로 조회한다.`, async () => {
      const response = await authenticatedRequest(
        app,
        'get',
        '/v1/user/bookmarks',
      );

      console.log('Response status:', response.status);
      console.log('Response body:', response.body);

      expect(response.status).toBe(HttpStatus.OK);

      // 페이지네이션 응답 구조 확인
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
      expect(response.body.data).toHaveProperty('totalPages');

      expect(Array.isArray(response.body.data.items)).toBe(true);
      expect(typeof response.body.data.total).toBe('number');
      expect(typeof response.body.data.page).toBe('number');
      expect(typeof response.body.data.limit).toBe('number');
      expect(typeof response.body.data.totalPages).toBe('number');

      if (response.body.data.items.length > 0) {
        const bookmark = response.body.data.items[0];
        expect(bookmark).toHaveProperty('id');
        expect(bookmark).toHaveProperty('userId');
        expect(bookmark).toHaveProperty('recipeId');
        expect(bookmark).toHaveProperty('recipeTitle');
        expect(bookmark).toHaveProperty('recipeDescription');
        expect(bookmark).toHaveProperty('recipeImages');
        expect(bookmark).toHaveProperty('createdAt');
      }
    });

    it(`${TEST_TAGS.AUTHENTICATED} /user/bookmarks (GET) - 페이지네이션 파라미터로 북마크를 조회한다.`, async () => {
      const response = await authenticatedRequest(
        app,
        'get',
        '/v1/user/bookmarks?page=1&limit=5',
      );

      console.log('Response status:', response.status);
      console.log('Response body:', response.body);

      expect(response.status).toBe(HttpStatus.OK);

      // 페이지네이션 응답 구조 확인
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
      expect(response.body.data).toHaveProperty('totalPages');

      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(5);
      expect(response.body.data.items.length).toBeLessThanOrEqual(5);
    });

    it(`${TEST_TAGS.UNAUTHENTICATED} /user/bookmarks (GET) - 인증되지 않은 사용자가 북마크를 조회할 경우 401 오류 발생`, async () => {
      const response = await unauthenticatedRequest(
        app,
        'get',
        '/v1/user/bookmarks',
      ).expect(HttpStatus.FORBIDDEN);

      expect(response.body).toMatchObject({
        message: 'Forbidden resource',
      });
    });

    it(`${TEST_TAGS.AUTHENTICATED} /user/bookmarks/:recipeId (DELETE) - 레시피 북마크를 해제한다.`, async () => {
      const recipeId = 2; // 북마크 해제할 레시피 ID

      const response = await authenticatedRequest(
        app,
        'delete',
        `/v1/user/bookmarks/${recipeId}`,
      ).expect(HttpStatus.OK);

      expect(response.body.data).toBe(true);
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
});
