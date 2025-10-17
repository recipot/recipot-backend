import { RecipeImage } from '@/database/entity/recipe-image.entity';
import { RecipeIngredient } from '@/database/entity/recipe-ingredient.entity';
import { RecipeRecommendationCondition } from '@/database/entity/recipe-recommendation-condition.entity';
import { Recipe } from '@/database/entity/recipe.entity';
import { UserRecipeRecommendation } from '@/database/entity/user-recipe-recommendation.entity';
import { UserUnavailableIngredient } from '@/database/entity/user-unavailable-ingredient.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetRecipeRecommendationRequestDto } from '../dto/get-recipe-recommendation-request.dto';
import { CacheLockService } from './cache-lock.service';
import { RecipeRecommendationService } from './recipe-recommendation.service';

type MockType<T> = {
  [P in keyof T]?: jest.Mock<any>;
};

const createRepositoryMock = <T>(): MockType<Repository<T>> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('RecipeRecommendationService', () => {
  let service: RecipeRecommendationService;

  const cacheLockServiceMock: jest.Mocked<CacheLockService> = {
    getFromCache: jest.fn(),
    setToCache: jest.fn(),
    tryAcquireLock: jest.fn(),
    releaseLock: jest.fn(),
    deleteByPattern: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipeRecommendationService,
        {
          provide: getRepositoryToken(RecipeRecommendationCondition),
          useFactory: createRepositoryMock,
        },
        {
          provide: getRepositoryToken(RecipeIngredient),
          useFactory: createRepositoryMock,
        },
        {
          provide: getRepositoryToken(Recipe),
          useFactory: createRepositoryMock,
        },
        {
          provide: getRepositoryToken(RecipeImage),
          useFactory: createRepositoryMock,
        },
        {
          provide: getRepositoryToken(UserRecipeRecommendation),
          useFactory: createRepositoryMock,
        },
        {
          provide: getRepositoryToken(UserUnavailableIngredient),
          useFactory: createRepositoryMock,
        },
        { provide: CacheLockService, useValue: cacheLockServiceMock },
      ],
    }).compile();

    service = module.get<RecipeRecommendationService>(
      RecipeRecommendationService,
    );

    jest.clearAllMocks();
    cacheLockServiceMock.getFromCache.mockReset();
    cacheLockServiceMock.setToCache.mockReset();
    cacheLockServiceMock.tryAcquireLock.mockReset();
    cacheLockServiceMock.releaseLock.mockReset();
    cacheLockServiceMock.deleteByPattern.mockReset();
  });

  describe('getRecipeRecommendationsWithCache', () => {
    const baseParams: GetRecipeRecommendationRequestDto = {
      conditionId: 1,
      pantryIds: [10, 20, 30],
      page: 2,
      pageSize: 3,
    } as any;

    it('캐시 히트 시: 캐시 슬라이스로 페이지네이션 반환하고 DB/계산을 호출하지 않는다', async () => {
      const cachedItems = Array.from({ length: 8 }).map((_, i) => ({
        recipeId: i + 1,
        title: `R${i + 1}`,
        description: `D${i + 1}`,
      }));
      cacheLockServiceMock.getFromCache.mockResolvedValue({
        items: cachedItems,
        totalItems: cachedItems.length,
        computedAt: Date.now(),
        ttlSec: 3600,
      });

      const spyRecompute = jest.spyOn<any, any>(service as any, 'recomputeAll');

      const res = await service.getRecipeRecommendationsWithCache(baseParams);

      expect(res.items).toHaveLength(3); // page 2, pageSize 3 => indices 3..5
      expect(res.items[0].recipeId).toBe(4);
      expect(res.totalItems).toBe(8);
      expect(res.currentPage).toBe(2);
      expect(res.totalPages).toBe(Math.ceil(8 / 3));

      expect(spyRecompute).not.toHaveBeenCalled();
      expect(cacheLockServiceMock.setToCache).not.toHaveBeenCalled();
    });

    it('DB 경로: 캐시 미스 + DB에서 조회 후 캐시에 전체 저장하고 페이지네이션 반환', async () => {
      cacheLockServiceMock.getFromCache.mockResolvedValueOnce(undefined as any);
      cacheLockServiceMock.tryAcquireLock.mockResolvedValue(true);

      const allItems = Array.from({ length: 5 }).map((_, i) => ({
        recipeId: i + 1,
        title: `T${i + 1}`,
        description: `Desc${i + 1}`,
      }));
      jest.spyOn<any, any>(service as any, 'recomputeAll').mockResolvedValue({
        allItems,
        totalItems: allItems.length,
      });

      // waitForComputation도 모킹 (락 획득 실패 시 호출됨)
      jest
        .spyOn<any, any>(service as any, 'waitForComputation')
        .mockResolvedValue({
          items: allItems.slice(0, 2),
          totalItems: allItems.length,
          currentPage: 1,
          totalPages: Math.ceil(allItems.length / 2),
        });

      const res = await service.getRecipeRecommendationsWithCache({
        ...baseParams,
        page: 1,
        pageSize: 2,
      });

      expect(res.items).toHaveLength(2);
      expect(res.totalItems).toBe(5);
      expect(cacheLockServiceMock.setToCache).toHaveBeenCalledTimes(1);
      expect(cacheLockServiceMock.setToCache).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ totalItems: 5, items: expect.any(Array) }),
        expect.any(Number),
      );
    });

    it('재계산 경로: 캐시 미스 + DB 없음 => 락 획득 후 재계산, 캐시에 저장, 페이지네이션 반환', async () => {
      // 1st cache miss
      cacheLockServiceMock.getFromCache.mockResolvedValueOnce(undefined as any);
      // recomputeAll returns empty through private method
      jest
        .spyOn<any, any>(service as any, 'recomputeAll')
        .mockResolvedValue({ allItems: [], totalItems: 0 });
      // acquire lock
      cacheLockServiceMock.tryAcquireLock.mockResolvedValue(true);
      // 2nd cache check after lock
      cacheLockServiceMock.getFromCache.mockResolvedValueOnce(undefined as any);

      const recomputeAllItems = Array.from({ length: 4 }).map((_, i) => ({
        recipeId: i + 1,
        title: `TT${i + 1}`,
        description: `DD${i + 1}`,
      }));
      jest
        .spyOn<any, any>(service as any, 'recomputeAll')
        .mockResolvedValue({ allItems: recomputeAllItems, totalItems: 4 });

      const res = await service.getRecipeRecommendationsWithCache({
        ...baseParams,
        page: 2,
        pageSize: 2,
      });

      expect(cacheLockServiceMock.setToCache).toHaveBeenCalledTimes(1);
      expect(cacheLockServiceMock.releaseLock).toHaveBeenCalledTimes(1);
      expect(res.items).toHaveLength(2);
      expect(res.items[0].recipeId).toBe(3);
      expect(res.totalItems).toBe(4);
    });
  });

  describe('invalidate*', () => {
    it('invalidateCacheByCondition: 패턴으로 삭제 호출', async () => {
      await service.invalidateCacheByCondition(7);
      expect(cacheLockServiceMock.deleteByPattern).toHaveBeenCalledWith(
        'recommend:v1:c:7:*',
      );
    });

    it('invalidateAllCache: 전체 패턴으로 삭제 호출', async () => {
      await service.invalidateAllCache();
      expect(cacheLockServiceMock.deleteByPattern).toHaveBeenCalledWith(
        'recommend:v1:*',
      );
    });
  });
});
