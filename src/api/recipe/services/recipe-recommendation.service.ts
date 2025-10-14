import { RecipeIngredient } from '@/database/entity/recipe-ingredient.entity';
import { RecipeRecommendationCondition } from '@/database/entity/recipe-recommendation-condition.entity';
import { Recipe } from '@/database/entity/recipe.entity';
import { UserRecipeRecommendation } from '@/database/entity/user-recipe-recommendation.entity';
import { UserUnavailableIngredient } from '@/database/entity/user-unavailable-ingredient.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetRecipeRecommendationRequestDto } from '../dto/get-recipe-recommendation-request.dto';
import {
  GetRecipeRecommendationResponseDto,
  RecipeRecommendationItemDto,
} from '../dto/get-recipe-recommendation-response.dto';
import { cacheKey, lockKey } from '../utils/cache-key.util';
import { CacheLockService } from './cache-lock.service';

@Injectable()
export class RecipeRecommendationService {
  private readonly logger = new Logger(RecipeRecommendationService.name);

  // 서버 내 설정값들
  private readonly DEFAULT_TTL_SEC = 604800; // 1주일
  private readonly DEFAULT_PERSIST = true; // 추천 결과를 DB에 저장
  private readonly LOCK_TTL_SEC = 8; // 락 TTL

  constructor(
    @InjectRepository(RecipeRecommendationCondition)
    private readonly recipeRecommendationConditionRepository: Repository<RecipeRecommendationCondition>,
    @InjectRepository(RecipeIngredient)
    private readonly recipeIngredientRepository: Repository<RecipeIngredient>,
    @InjectRepository(Recipe)
    private readonly recipeRepository: Repository<Recipe>,
    @InjectRepository(UserRecipeRecommendation)
    private readonly userRecipeRecommendationRepository: Repository<UserRecipeRecommendation>,
    @InjectRepository(UserUnavailableIngredient)
    private readonly userUnavailableIngredientRepository: Repository<UserUnavailableIngredient>,
    private readonly cacheLockService: CacheLockService,
  ) {}

  /**
   * 캐시를 활용한 레시피 추천 (페이지네이션 지원)
   */
  async getRecipeRecommendationsWithCache(
    params: GetRecipeRecommendationRequestDto,
    userId?: number,
  ): Promise<GetRecipeRecommendationResponseDto> {
    const { conditionId, pantryIds, page = 1, pageSize = 3 } = params;
    const offset = (page - 1) * pageSize;

    // 서버 내 설정값들 사용
    const ttlSec = this.DEFAULT_TTL_SEC;
    const persist = this.DEFAULT_PERSIST;

    // 사용자의 못 먹는 재료를 DB에서 가져오기
    const unavailableIds = userId
      ? await this.getUserUnavailableIngredients(userId)
      : [];

    const key = cacheKey(conditionId, pantryIds, unavailableIds);

    // 1) Redis 해시키로 캐시 존재 여부 확인
    const cached = await this.cacheLockService.getFromCache<{
      items: RecipeRecommendationItemDto[];
      totalItems: number;
      computedAt: number;
      ttlSec: number;
    }>(key);

    if (cached?.items) {
      this.logger.log(
        `캐시 히트: ${key}, 페이지: ${page}, 페이지크기: ${pageSize}`,
      );

      // 캐시된 데이터에서 페이지네이션 적용
      const paginatedItems = cached.items.slice(offset, offset + pageSize);
      const totalPages = Math.ceil(cached.totalItems / pageSize);

      return {
        items: paginatedItems,
        currentPage: page,
        pageSize,
        totalItems: cached.totalItems,
        totalPages,
        hasNextPage: page < totalPages,
      };
    }

    // 2) Redis 해시키로 DB에서 추천 결과 조회 (조건별 공통 데이터)
    const dbRecommendations = await this.getRecommendationsFromDb(
      conditionId,
      key,
      offset,
      pageSize,
    );

    if (dbRecommendations.items.length > 0) {
      this.logger.log(
        `DB에서 추천 결과 조회: ${key}, 페이지: ${page}, 페이지크기: ${pageSize}, ${dbRecommendations.items.length}개`,
      );

      // 캐시에 저장 (전체 데이터)
      const computedAt = Date.now();
      await this.cacheLockService.setToCache(
        key,
        {
          items: dbRecommendations.allItems,
          totalItems: dbRecommendations.totalItems,
          computedAt,
          ttlSec,
        },
        ttlSec,
      );

      const totalPages = Math.ceil(dbRecommendations.totalItems / pageSize);

      return {
        items: dbRecommendations.items,
        currentPage: page,
        pageSize,
        totalItems: dbRecommendations.totalItems,
        totalPages,
        hasNextPage: page < totalPages,
      };
    } else {
      this.logger.log(`DB에서 추천 결과 없음: ${key}`);
    }

    // 3) 락 획득 (다중 요청 동시 유입 시 재계산 한 번만)
    const lockKeyStr = lockKey(key);
    const hasLock = await this.cacheLockService.tryAcquireLock(
      lockKeyStr,
      this.LOCK_TTL_SEC,
    );

    try {
      // 4) 다른 프로세스가 이미 채워두었을 수 있으니 재확인
      const cached2 = await this.cacheLockService.getFromCache<{
        items: RecipeRecommendationItemDto[];
        totalItems: number;
        computedAt: number;
        ttlSec: number;
      }>(key);

      if (cached2?.items) {
        this.logger.log(
          `락 후 캐시 히트: ${key}, 페이지: ${page}, 페이지크기: ${pageSize}`,
        );

        // 캐시된 데이터에서 페이지네이션 적용
        const paginatedItems = cached2.items.slice(offset, offset + pageSize);
        const totalPages = Math.ceil(cached2.totalItems / pageSize);

        return {
          items: paginatedItems,
          currentPage: page,
          pageSize,
          totalItems: cached2.totalItems,
          totalPages,
          hasNextPage: page < totalPages,
        };
      }

      // 5) 실제 계산
      this.logger.log(`캐시 미스, 계산 시작: ${key}`);
      const result = await this.recomputeAll({
        conditionId,
        pantryIds,
        unavailableIds,
        persist,
        userId,
      });

      // 6) 캐시에 저장
      const computedAt = Date.now();
      await this.cacheLockService.setToCache(
        key,
        {
          items: result.allItems,
          totalItems: result.totalItems,
          computedAt,
          ttlSec,
        },
        ttlSec,
      );

      // 페이지네이션 적용
      const paginatedItems = result.allItems.slice(offset, offset + pageSize);
      const totalPages = Math.ceil(result.totalItems / pageSize);

      return {
        items: paginatedItems,
        currentPage: page,
        pageSize,
        totalItems: result.totalItems,
        totalPages,
        hasNextPage: page < totalPages,
      };
    } finally {
      if (hasLock) {
        await this.cacheLockService.releaseLock(lockKeyStr);
      }
    }
  }

  /**
   * DB에서 Redis 해시키로 추천 결과를 조회합니다. (페이지네이션 지원)
   */
  private async getRecommendationsFromDb(
    conditionId: number,
    redisHashKey: string,
    offset: number,
    limit: number,
  ): Promise<{
    items: RecipeRecommendationItemDto[];
    allItems: RecipeRecommendationItemDto[];
    totalItems: number;
  }> {
    try {
      // 전체 데이터 조회 (캐시용)
      const allDbRecommendations = await this.userRecipeRecommendationRepository
        .createQueryBuilder('urr')
        .leftJoin('Recipe', 'r', 'r.id = urr.recipeId')
        .where('urr.conditionId = :conditionId', { conditionId })
        .andWhere('urr.redisHashKey = :redisHashKey', { redisHashKey })
        .orderBy('urr.score', 'DESC')
        .select(['urr.recipeId', 'r.title', 'r.description', 'r.imageUrl'])
        .getRawMany();

      if (allDbRecommendations.length === 0) {
        this.logger.log(
          `DB에서 추천 결과 없음: 컨디션 ${conditionId}, Redis 키 ${redisHashKey}`,
        );
        return {
          items: [],
          allItems: [],
          totalItems: 0,
        };
      }

      // 전체 결과를 DTO 형태로 변환
      const allRecommendations: RecipeRecommendationItemDto[] =
        allDbRecommendations.map((rec) => ({
          recipeId: rec.urr_recipeId,
          title: rec.r_title,
          description: rec.r_description,
          imageUrl: rec.r_imageUrl,
        }));

      // 페이지네이션 적용
      const paginatedItems = allRecommendations.slice(offset, offset + limit);

      this.logger.log(
        `DB에서 추천 결과 조회 성공: 컨디션 ${conditionId}, 전체 ${allRecommendations.length}개, 페이지 ${paginatedItems.length}개`,
      );

      return {
        items: paginatedItems,
        allItems: allRecommendations,
        totalItems: allRecommendations.length,
      };
    } catch (error) {
      this.logger.error('DB에서 추천 결과 조회 중 에러 발생', error);
      return {
        items: [],
        allItems: [],
        totalItems: 0,
      };
    }
  }

  /**
   * 사용자의 못 먹는 재료 ID 배열을 가져옵니다.
   */
  private async getUserUnavailableIngredients(
    userId: number,
  ): Promise<number[]> {
    const unavailableIngredients =
      await this.userUnavailableIngredientRepository.find({
        where: { userId },
        select: ['ingredientId'],
      });

    return unavailableIngredients.map((ui) => ui.ingredientId);
  }

  /**
   * 실제 레시피 추천 계산 로직 (전체 데이터 반환)
   */
  private async recomputeAll(args: {
    conditionId: number;
    pantryIds: number[];
    unavailableIds: number[];
    persist?: boolean;
    userId?: number;
  }): Promise<{
    allItems: RecipeRecommendationItemDto[];
    totalItems: number;
  }> {
    const { conditionId, pantryIds, unavailableIds, persist, userId } = args;

    this.logger.log(
      `레시피 추천 계산 시작 - 컨디션: ${conditionId}, 팬트리: ${pantryIds.length}개, 못먹는재료: ${unavailableIds.length}개`,
    );

    // 1) 해당 컨디션에 맞는 레시피 추천 조건들을 조회
    const recommendationConditions =
      await this.recipeRecommendationConditionRepository.find({
        where: { conditionId },
      });

    this.logger.log(
      `컨디션 ${conditionId}에 대한 추천 조건 ${recommendationConditions.length}개 조회 완료`,
    );

    if (recommendationConditions.length === 0) {
      this.logger.warn(`컨디션 ${conditionId}에 대한 추천 레시피가 없습니다.`);
      return {
        allItems: [],
        totalItems: 0,
      };
    }

    // 2) 각 레시피의 재료 정보를 조회
    const recipeIds = recommendationConditions.map((rc) => rc.recipeId);
    this.logger.log(`레시피 ID 목록: [${recipeIds.join(', ')}]`);

    const recipeIngredients = await this.recipeIngredientRepository.find({
      where: recipeIds.map((id) => ({ recipeId: id })),
    });

    this.logger.log(`레시피 재료 정보 ${recipeIngredients.length}개 조회 완료`);

    // 3) 레시피별로 재료 충족률 계산
    const recipeScores: Array<{
      recipeId: number;
      title: string;
      description: string;
      score: number;
      ingredientFulfillmentRate: number;
      priorityScore: number;
      missingIngredientIds: number[];
      imageUrl?: string;
    }> = [];

    for (const rc of recommendationConditions) {
      this.logger.log(
        `레시피 ${rc.recipeId} 처리 시작 (우선순위: ${rc.priorityScore})`,
      );

      // 레시피 정보를 별도로 조회
      const recipe = await this.recipeRepository.findOne({
        where: { id: rc.recipeId },
      });

      if (!recipe) {
        this.logger.warn(`레시피 ${rc.recipeId}를 찾을 수 없어 스킵합니다.`);
        continue; // 레시피가 없으면 스킵
      }

      const ingredients = recipeIngredients.filter(
        (ri) => ri.recipeId === recipe.id,
      );
      this.logger.log(
        `레시피 ${rc.recipeId}의 재료 ${ingredients.length}개 조회`,
      );

      // 필수 재료만 계산 (대체 가능한 재료는 제외)
      const essentialIngredients = ingredients.filter(
        (ri) => !ri.isAlternative,
      );
      this.logger.log(
        `필수 재료 ${essentialIngredients.length}개 (전체 ${ingredients.length}개 중)`,
      );

      if (essentialIngredients.length === 0) {
        this.logger.warn(
          `레시피 ${rc.recipeId}에 필수 재료가 없어 스킵합니다.`,
        );
        continue; // 필수 재료가 없으면 스킵
      }

      // 사용자가 못 먹는 재료 제외
      const availableIngredients = essentialIngredients.filter(
        (ri) => !unavailableIds.includes(ri.ingredientId),
      );
      this.logger.log(
        `사용 가능한 재료 ${availableIngredients.length}개 (못먹는재료 제외)`,
      );

      // 보유한 재료 개수 계산
      const ownedIngredients = availableIngredients.filter((ri) =>
        pantryIds.includes(ri.ingredientId),
      );
      this.logger.log(`보유한 재료 ${ownedIngredients.length}개`);

      // 재료 충족률 계산
      const ingredientFulfillmentRate =
        ownedIngredients.length / availableIngredients.length;

      // 종합 점수 = 우선순위 점수 * 재료 충족률
      const score = rc.priorityScore * ingredientFulfillmentRate;

      // 부족한 재료 ID들
      const missingIngredientIds = availableIngredients
        .filter((ri) => !pantryIds.includes(ri.ingredientId))
        .map((ri) => ri.ingredientId);

      this.logger.log(
        `레시피 ${rc.recipeId} 점수 계산 완료 - 충족률: ${(ingredientFulfillmentRate * 100).toFixed(1)}%, 종합점수: ${score.toFixed(2)}, 부족재료: ${missingIngredientIds.length}개`,
      );

      recipeScores.push({
        recipeId: recipe.id,
        title: recipe.title,
        description: recipe.description,
        score,
        ingredientFulfillmentRate,
        priorityScore: rc.priorityScore,
        missingIngredientIds,
      });
    }

    // 4) 점수 순으로 정렬
    this.logger.log(`총 ${recipeScores.length}개 레시피 점수 계산 완료`);

    const sortedScores = recipeScores.sort((a, b) => b.score - a.score);
    this.logger.log(
      `점수 순 정렬 결과: ${sortedScores.map((r) => `레시피${r.recipeId}:${r.score.toFixed(2)}`).join(', ')}`,
    );

    // 5) 모든 계산된 레시피를 DB에 저장 (옵션)
    if (persist && userId) {
      this.logger.log(
        `모든 추천 결과를 DB에 저장합니다 (사용자: ${userId}, 총 ${sortedScores.length}개)`,
      );
      await this.saveAllRecommendationResults(
        sortedScores,
        conditionId,
        pantryIds,
        unavailableIds,
      );
    }

    // 6) 전체 데이터 반환 (스코어 및 부족한 재료 정보 제외)
    const allItems = sortedScores.map((recipe) => ({
      recipeId: recipe.recipeId,
      title: recipe.title,
      description: recipe.description,
      imageUrl: recipe.imageUrl,
    }));

    this.logger.log(
      `전체 레시피 처리 완료: [${allItems.map((r) => r.recipeId).join(', ')}]`,
    );

    this.logger.log(`레시피 추천 계산 완료 - 전체 결과 ${allItems.length}개`);
    return {
      allItems,
      totalItems: allItems.length,
    };
  }

  /**
   * 모든 추천 결과를 DB에 저장 (새로운 메서드)
   */
  private async saveAllRecommendationResults(
    allRecommendations: Array<{
      recipeId: number;
      title: string;
      description: string;
      score: number;
      ingredientFulfillmentRate: number;
      priorityScore: number;
      missingIngredientIds: number[];
      imageUrl?: string;
    }>,
    conditionId: number,
    pantryIds: number[],
    unavailableIds: number[],
  ): Promise<void> {
    // 기존 추천 결과 삭제 (같은 컨디션, 같은 Redis 해시키)
    const redisHashKey = cacheKey(conditionId, pantryIds, unavailableIds);
    await this.userRecipeRecommendationRepository.delete({
      conditionId,
      redisHashKey,
    });

    const entities = allRecommendations.map((rec) =>
      this.userRecipeRecommendationRepository.create({
        recipeId: rec.recipeId,
        conditionId,
        basedOn: 'R10001', // TODO 공통코드 조회
        score: rec.score,
        ingredientFulfillmentRate: rec.ingredientFulfillmentRate,
        missingIngredientCount: rec.missingIngredientIds.length,
        redisHashKey,
      }),
    );

    await this.userRecipeRecommendationRepository.save(entities);
    this.logger.log(
      `모든 추천 결과 저장 완료: 컨디션 ${conditionId}, 총 ${entities.length}개, Redis 키: ${redisHashKey}`,
    );
  }

  /**
   * 특정 컨디션의 캐시를 무효화
   */
  async invalidateCacheByCondition(conditionId: number): Promise<void> {
    const pattern = `recommend:v1:c:${conditionId}:*`;
    await this.cacheLockService.deleteByPattern(pattern);
    this.logger.log(`컨디션 ${conditionId} 캐시 무효화 완료`);
  }

  /**
   * 전체 캐시를 무효화 (버전 업그레이드 시)
   */
  async invalidateAllCache(): Promise<void> {
    const pattern = 'recommend:v1:*';
    await this.cacheLockService.deleteByPattern(pattern);
    this.logger.log('전체 추천 캐시 무효화 완료');
  }
}
