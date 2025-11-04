import { CacheLockService } from '@/common/cache/cache-lock.service';
import { RECOMMENDATION_CONFIG } from '@/common/constants/recipe.constants';
import { CustomException } from '@/common/exceptions/custom-exception';
import { CommonCode } from '@/database/entity/common-code.entity';
import { RecipeImage } from '@/database/entity/recipe-image.entity';
import { RecipeIngredient } from '@/database/entity/recipe-ingredient.entity';
import { RecipeRecommendationCondition } from '@/database/entity/recipe-recommendation-condition.entity';
import { RecipeTool } from '@/database/entity/recipe-tool.entity';
import { Recipe } from '@/database/entity/recipe.entity';
import { Tool } from '@/database/entity/tool.entity';
import { UserRecipeBookmark } from '@/database/entity/user-recipe-bookmark.entity';
import { UserRecipeRecommendation } from '@/database/entity/user-recipe-recommendation.entity';
import { UserUnavailableIngredient } from '@/database/entity/user-unavailable-ingredient.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { GetRecipeRecommendationRequestDto } from '../dto/get-recipe-recommendation-request.dto';
import {
  GetRecipeRecommendationResponseDto,
  RecipeRecommendationItemDto,
} from '../dto/get-recipe-recommendation-response.dto';
import {
  CachedRecommendation,
  PaginationResult,
  RecipeScore,
  RecomputeParams,
} from '../interfaces/recommendation.interface';
import { cacheKey, lockKey } from '../utils/cache-key.util';

@Injectable()
export class RecipeRecommendationService {
  private readonly logger = new Logger(RecipeRecommendationService.name);

  constructor(
    @InjectRepository(RecipeRecommendationCondition)
    private readonly recipeRecommendationConditionRepository: Repository<RecipeRecommendationCondition>,
    @InjectRepository(RecipeIngredient)
    private readonly recipeIngredientRepository: Repository<RecipeIngredient>,
    @InjectRepository(Recipe)
    private readonly recipeRepository: Repository<Recipe>,
    @InjectRepository(RecipeImage)
    private readonly recipeImageRepository: Repository<RecipeImage>,
    @InjectRepository(RecipeTool)
    private readonly recipeToolRepository: Repository<RecipeTool>,
    @InjectRepository(Tool)
    private readonly toolRepository: Repository<Tool>,
    @InjectRepository(UserRecipeBookmark)
    private readonly userRecipeBookmarkRepository: Repository<UserRecipeBookmark>,
    @InjectRepository(UserRecipeRecommendation)
    private readonly userRecipeRecommendationRepository: Repository<UserRecipeRecommendation>,
    @InjectRepository(UserUnavailableIngredient)
    private readonly userUnavailableIngredientRepository: Repository<UserUnavailableIngredient>,
    @InjectRepository(CommonCode)
    private readonly commonCodeRepository: Repository<CommonCode>,
    private readonly cacheLockService: CacheLockService,
  ) {}

  /**
   * 캐시를 활용한 레시피 추천 (페이지네이션 지원)
   * 캐시 → DB → 재계산 순서로 추천 결과를 조회합니다.
   */
  async getRecipeRecommendationsWithCache(
    params: GetRecipeRecommendationRequestDto,
    userId?: number,
  ): Promise<GetRecipeRecommendationResponseDto> {
    const { conditionId, pantryIds, page = 1, pageSize = 3 } = params;

    const unavailableIds = userId
      ? await this.getUserUnavailableIngredients(userId)
      : [];
    const key = cacheKey(conditionId, pantryIds, unavailableIds);

    // 1단계: Redis 캐시 조회
    const cachedResult = await this.getFromCache(key);
    if (cachedResult) {
      return this.paginateResult(cachedResult, page, pageSize, 'cache');
    }

    // 2단계: 캐시 미스 시 재계산 (분산 락 적용)
    // 캐시 미스는 데이터가 무효화되었다는 의미이므로 DB 폴백 없이 재계산
    return await this.computeWithLock(
      key,
      { conditionId, pantryIds, unavailableIds, persist: true, userId },
      page,
      pageSize,
    );
  }

  /**
   * Redis 캐시에서 추천 결과 조회
   */
  private async getFromCache(
    key: string,
  ): Promise<CachedRecommendation | null> {
    const cached =
      await this.cacheLockService.getFromCache<CachedRecommendation>(key);

    if (cached?.items) {
      this.logger.log(`캐시 히트: ${key}`);
      return cached;
    }

    return null;
  }

  /**
   * Redis 캐시에 추천 결과 저장
   */
  private async saveToCache(
    key: string,
    data: PaginationResult,
  ): Promise<void> {
    const cacheData: CachedRecommendation = {
      items: data.allItems,
      totalItems: data.totalItems,
      computedAt: Date.now(),
      ttlSec: RECOMMENDATION_CONFIG.DEFAULT_TTL_SEC,
    };

    await this.cacheLockService.setToCache(
      key,
      cacheData,
      RECOMMENDATION_CONFIG.DEFAULT_TTL_SEC,
    );
  }

  /**
   * 분산 락을 사용한 추천 계산
   */
  private async computeWithLock(
    key: string,
    params: RecomputeParams,
    page: number,
    pageSize: number,
  ): Promise<GetRecipeRecommendationResponseDto> {
    const lockKeyStr = lockKey(key);
    const lockToken = await this.cacheLockService.acquireLock(
      lockKeyStr,
      RECOMMENDATION_CONFIG.LOCK_TTL_SEC,
    );

    if (lockToken) {
      // 락을 획득한 경우: 계산 수행
      try {
        // 락 획득 후 캐시 재확인 (다른 프로세스가 이미 계산했을 수 있음)
        const cachedAfterLock = await this.getFromCache(key);
        if (cachedAfterLock) {
          return this.paginateResult(
            cachedAfterLock,
            page,
            pageSize,
            'cache-after-lock',
          );
        }

        // 실제 계산 수행
        this.logger.debug(`계산 시작: ${key}`);
        const result = await this.recomputeAll(params);

        // 캐시 저장
        await this.saveToCache(key, result);

        return this.paginateResult(result, page, pageSize, 'computed');
      } finally {
        const released = await this.cacheLockService.releaseLock(
          lockKeyStr,
          lockToken,
        );
        if (!released) {
          this.logger.warn(
            `락 해제 실패 (이미 만료되었을 수 있음): ${lockKeyStr}`,
          );
        }
      }
    } else {
      // 락을 획득하지 못한 경우: 다른 프로세스가 계산할 때까지 대기
      this.logger.log(`락 획득 실패, 다른 프로세스 계산 대기: ${key}`);
      return await this.waitForComputation(key, page, pageSize);
    }
  }

  /**
   * 다른 프로세스의 계산 완료를 대기
   */
  private async waitForComputation(
    key: string,
    page: number,
    pageSize: number,
  ): Promise<GetRecipeRecommendationResponseDto> {
    const maxWaitTime = RECOMMENDATION_CONFIG.MAX_WAIT_TIME_MS;
    const pollInterval = RECOMMENDATION_CONFIG.POLL_INTERVAL_MS;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      // 캐시에서 결과 확인
      const cachedResult = await this.getFromCache(key);
      if (cachedResult) {
        this.logger.log(`대기 완료, 캐시에서 결과 조회: ${key}`);
        return this.paginateResult(
          cachedResult,
          page,
          pageSize,
          'waited-cache',
        );
      }

      // 잠시 대기
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    // 타임아웃 시 에러 반환
    this.logger.warn(`계산 대기 타임아웃: ${key}`);
    throw new CustomException(
      {
        code: 'RECOMMENDATION_TIMEOUT',
        message:
          '레시피 추천 계산이 시간 초과되었습니다. 잠시 후 다시 시도해주세요.',
      },
      408, // Request Timeout
    );
  }

  /**
   * 페이지네이션 적용 및 응답 생성
   */
  private paginateResult(
    data: CachedRecommendation | PaginationResult,
    page: number,
    pageSize: number,
    source: string,
  ): GetRecipeRecommendationResponseDto {
    const offset = (page - 1) * pageSize;
    const items = 'allItems' in data ? data.allItems : data.items;
    const paginatedItems = items.slice(offset, offset + pageSize);
    const totalPages = Math.ceil(data.totalItems / pageSize);

    this.logger.debug(
      `→ ${source} 응답: 페이지 ${page}/${totalPages}, ${paginatedItems.length}개 항목`,
    );

    return {
      items: paginatedItems,
      currentPage: page,
      pageSize,
      totalItems: data.totalItems,
      totalPages,
      hasNextPage: page < totalPages,
    };
  }

  /**
   * 사용자의 못 먹는 재료 ID 조회
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
   * 레시피 추천 재계산
   * 1. 추천 조건 조회
   * 2. 레시피 재료 조회
   * 3. 점수 계산
   * 4. DB 저장 (옵션)
   */
  private async recomputeAll(
    params: RecomputeParams,
  ): Promise<PaginationResult> {
    const { conditionId, pantryIds, unavailableIds, persist } = params;

    this.logger.debug(
      `추천 계산 - 조건: ${conditionId}, 팬트리: ${pantryIds.length}개, 제외: ${unavailableIds.length}개`,
    );

    // 1. 추천 조건 조회
    const recommendationConditions =
      await this.getRecommendationConditions(conditionId);
    if (recommendationConditions.length === 0) {
      this.logger.warn(`조건 ${conditionId}에 대한 추천 레시피가 없습니다`);
      return { allItems: [], items: [], totalItems: 0 };
    }

    // 2. 레시피 재료 조회
    const recipeIds = recommendationConditions.map((rc) => rc.recipeId);
    const recipeIngredients = await this.getRecipeIngredients(recipeIds);

    // 3. 점수 계산
    const recipeScores = await this.calculateRecipeScores(
      recommendationConditions,
      recipeIngredients,
      pantryIds,
      unavailableIds,
      params.userId,
    );

    // 4. 정렬 및 DB 저장
    const sortedScores = this.sortByScore(recipeScores);

    if (
      persist &&
      conditionId &&
      Array.isArray(pantryIds) &&
      Array.isArray(unavailableIds)
    ) {
      await this.persistRecommendations(
        sortedScores,
        conditionId,
        pantryIds,
        unavailableIds,
      );
    }

    const allItems = this.mapToDto(sortedScores);

    this.logger.debug(`계산 완료: ${allItems.length}개 레시피`);

    return {
      allItems,
      items: allItems,
      totalItems: allItems.length,
    };
  }

  /**
   * 추천 조건 조회
   */
  private async getRecommendationConditions(
    conditionId: number,
  ): Promise<RecipeRecommendationCondition[]> {
    const conditions = await this.recipeRecommendationConditionRepository.find({
      where: { conditionId },
    });

    this.logger.debug(`→ 추천 조건 ${conditions.length}개 조회`);
    return conditions;
  }

  /**
   * 레시피 재료 조회
   */
  private async getRecipeIngredients(
    recipeIds: number[],
  ): Promise<RecipeIngredient[]> {
    const ingredients = await this.recipeIngredientRepository.find({
      where: recipeIds.map((id) => ({ recipeId: id })),
    });

    this.logger.debug(`→ 재료 정보 ${ingredients.length}개 조회`);
    return ingredients;
  }

  /**
   * 레시피별 점수 계산
   */
  private async calculateRecipeScores(
    conditions: RecipeRecommendationCondition[],
    allIngredients: RecipeIngredient[],
    pantryIds: number[],
    unavailableIds: number[],
    userId?: number,
  ): Promise<RecipeScore[]> {
    const scores: RecipeScore[] = [];

    // 모든 레시피 ID 가져오기
    const recipeIds = conditions.map((c) => c.recipeId);

    // 레시피 이미지 일괄 조회
    const recipeImages = await this.recipeImageRepository.find({
      where: recipeIds.map((id) => ({ recipeId: id })),
    });

    // 레시피별 이미지 맵 생성
    const imageMap = new Map<number, string[]>();
    for (const img of recipeImages) {
      if (!imageMap.has(img.recipeId)) {
        imageMap.set(img.recipeId, []);
      }
      imageMap.get(img.recipeId)!.push(img.imageUrl);
    }

    // 레시피 조리도구 일괄 조회
    const recipeTools = await this.recipeToolRepository.find({
      where: recipeIds.map((id) => ({ recipeId: id })),
    });

    // 도구 ID 목록 추출
    const toolIds = [...new Set(recipeTools.map((rt) => rt.toolId))];

    // 도구 정보 일괄 조회
    const tools = await this.toolRepository.find({
      where: { id: In(toolIds) },
    });
    const toolMap = new Map<number, string>();
    for (const tool of tools) {
      toolMap.set(tool.id, tool.name);
    }

    // 레시피별 조리도구 맵 생성
    const recipeToolsMap = new Map<number, string[]>();
    for (const rt of recipeTools) {
      if (!recipeToolsMap.has(rt.recipeId)) {
        recipeToolsMap.set(rt.recipeId, []);
      }
      const toolName = toolMap.get(rt.toolId);
      if (toolName) {
        recipeToolsMap.get(rt.recipeId)!.push(toolName);
      }
    }

    // 북마크 정보 일괄 조회 (userId가 있을 경우)
    const bookmarkMap = new Map<number, boolean>();
    if (userId) {
      const bookmarks = await this.userRecipeBookmarkRepository.find({
        where: { userId, recipeId: In(recipeIds) },
      });
      for (const bookmark of bookmarks) {
        bookmarkMap.set(bookmark.recipeId, true);
      }
    }

    // 레시피 일괄 조회 (삭제된 레시피 제외)
    const recipes = await this.recipeRepository.find({
      where: { id: In(recipeIds), deletedAt: IsNull() },
      select: ['id', 'title', 'description', 'duration'],
    });

    // 레시피 맵 생성 (N+1 쿼리 방지)
    const recipeById = new Map(recipes.map((r) => [r.id, r]));

    for (const condition of conditions) {
      const recipe = recipeById.get(condition.recipeId);

      if (!recipe) {
        this.logger.debug(`레시피 ${condition.recipeId} 없음, 스킵`);
        continue;
      }

      const ingredients = allIngredients.filter(
        (ri) => ri.recipeId === recipe.id,
      );
      // TODO 1차 개발에서 필수 재료 필터링 제외
      // const essentialIngredients = ingredients.filter(
      //   (ri) => !ri.isAlternative,
      // );

      if (ingredients.length === 0) {
        this.logger.debug(`레시피 ${recipe.id} 재료 없음, 스킵`);
        continue;
      }

      const score = this.computeRecipeScore(
        recipe,
        ingredients,
        pantryIds,
        unavailableIds,
        condition.priorityScore,
        imageMap.get(recipe.id),
        recipeToolsMap.get(recipe.id),
        bookmarkMap.get(recipe.id),
        recipe.duration,
      );

      scores.push(score);
    }

    return scores;
  }

  /**
   * 개별 레시피 점수 계산
   */
  private computeRecipeScore(
    recipe: Recipe,
    essentialIngredients: RecipeIngredient[],
    pantryIds: number[],
    unavailableIds: number[],
    priorityScore: number,
    imageUrls?: string[],
    tools?: string[],
    isBookmarked?: boolean,
    duration?: number,
  ): RecipeScore {
    // 사용 가능한 재료 (못 먹는 재료 제외)
    const availableIngredients = essentialIngredients.filter(
      (ri) => !unavailableIds.includes(ri.ingredientId),
    );

    // 보유한 재료
    const ownedIngredients = availableIngredients.filter((ri) =>
      pantryIds.includes(ri.ingredientId),
    );

    // 재료 충족률
    // pantryIds가 비어있으면 재료 조건을 고려하지 않으므로 충족률 1로 간주
    const ingredientFulfillmentRate =
      pantryIds.length === 0
        ? 1
        : availableIngredients.length > 0
          ? ownedIngredients.length / availableIngredients.length
          : 0;

    // 종합 점수
    const score = priorityScore * ingredientFulfillmentRate;

    // 부족한 재료
    const missingIngredientIds = availableIngredients
      .filter((ri) => !pantryIds.includes(ri.ingredientId))
      .map((ri) => ri.ingredientId);

    this.logger.debug(
      `레시피 ${recipe.id}: 충족률 ${(ingredientFulfillmentRate * 100).toFixed(1)}%, 점수 ${score.toFixed(2)}`,
    );

    return {
      recipeId: recipe.id,
      title: recipe.title,
      description: recipe.description,
      score,
      ingredientFulfillmentRate,
      priorityScore,
      missingIngredientIds,
      imageUrls,
      duration: duration
        ? `${duration}분`
        : recipe.duration
          ? `${recipe.duration}분`
          : undefined,
      tools,
      isBookmarked: isBookmarked || false,
    };
  }

  /**
   * 점수 기준 정렬
   * 1차: score (종합 점수)
   * 2차: priorityScore (컨디션별 가중치)
   */
  private sortByScore(scores: RecipeScore[]): RecipeScore[] {
    return scores.sort((a, b) => {
      // 1차 정렬: score (높은 순)
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // 2차 정렬: priorityScore (높은 순)
      return b.priorityScore - a.priorityScore;
    });
  }

  /**
   * DTO 변환
   */
  private mapToDto(scores: RecipeScore[]): RecipeRecommendationItemDto[] {
    return scores.map((score) => ({
      recipeId: score.recipeId,
      title: score.title,
      description: score.description,
      imageUrls: score.imageUrls ?? [],
      duration: score.duration,
      tools: score.tools ?? [],
      isBookmarked: score.isBookmarked,
    }));
  }

  /**
   * 추천 결과 DB 저장
   */
  private async persistRecommendations(
    recommendations: RecipeScore[],
    conditionId: number,
    pantryIds: number[],
    unavailableIds: number[],
  ): Promise<void> {
    const redisHashKey = cacheKey(conditionId, pantryIds, unavailableIds);

    // 기존 데이터 삭제 (redisHashKey별로)
    await this.userRecipeRecommendationRepository.delete({
      conditionId,
      redisHashKey,
    });

    // 새 데이터 저장
    const entities = recommendations.map((rec) =>
      this.userRecipeRecommendationRepository.create({
        recipeId: rec.recipeId,
        conditionId,
        basedOn: RECOMMENDATION_CONFIG.BASED_ON_CODE,
        score: rec.score,
        ingredientFulfillmentRate: rec.ingredientFulfillmentRate,
        missingIngredientCount: rec.missingIngredientIds.length,
        redisHashKey,
      }),
    );

    await this.userRecipeRecommendationRepository.save(entities);

    this.logger.debug(
      `DB 저장 완료: 조건 ${conditionId}, ${entities.length}개 항목`,
    );
  }

  /**
   * 특정 컨디션의 캐시 무효화
   */
  async invalidateCacheByCondition(conditionId: number): Promise<void> {
    const pattern = `recommend:v1:c:${conditionId}:*`;
    await this.cacheLockService.deleteByPattern(pattern);
    this.logger.log(`캐시 무효화: 조건 ${conditionId}`);
  }

  /**
   * 전체 캐시 무효화
   */
  async invalidateAllCache(): Promise<void> {
    const pattern = 'recommend:v1:*';
    await this.cacheLockService.deleteByPattern(pattern);
    this.logger.log('전체 캐시 무효화 완료');
  }
}
