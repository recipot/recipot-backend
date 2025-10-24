import {
  SaveUnavailableIngredientsDto,
  SaveUnavailableIngredientsResponseDto,
} from '@/api/user/dto/save-unavailable-ingredients.dto';
import { CacheService } from '@/common/cache/cache.service';
import { CustomLoggerService } from '@/common/logger/custom-logger.service';
import { LoggerFactoryService } from '@/common/logger/logger-factory.service';
import { CommonCode } from '@/database/entity/common-code.entity';
import { Ingredient } from '@/database/entity/ingredient.entity';
import { Recipe } from '@/database/entity/recipe.entity';
import { UserCompletedRecipe } from '@/database/entity/user-completed-recipe.entity';
import {
  TimeSlot,
  UserDailyConditions,
} from '@/database/entity/user-daily-conditions.entity';
import { UserRecentRecipes } from '@/database/entity/user-recent-recipes.entity';
import { UserRecipeBookmark } from '@/database/entity/user-recipe-bookmark.entity';
import { User } from '@/database/entity/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { ERROR_CODES } from '../../common/constants/error-codes';
import { CustomException } from '../../common/exceptions/custom-exception';
import { SocialLoginService } from '../social-login/social-login.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { GetBookmarksRequestDto } from './dto/get-bookmarks-request.dto';
import { GetBookmarksResponseDto } from './dto/get-bookmarks-response.dto';
import { GetPendingReviewsResponseDto } from './dto/get-pending-reviews.dto';
import { GetRecentRecipesRequestDto } from './dto/get-recent-recipes-request.dto';
import { GetRecentRecipesResponseDto } from './dto/get-recent-recipes-response.dto';
import { GetUserConditionResponseDto } from './dto/get-user-condition.dto';
import { MyPageSummaryDto } from './dto/mypage.dto';
import {
  SaveUserConditionDto,
  SaveUserConditionResponseDto,
} from './dto/save-user-condition.dto';
import {
  SaveUserIngredientsSurveyDto,
  SaveUserIngredientsSurveyResponseDto,
} from './dto/save-user-ingredients-survey.dto';
import { UserDto } from './dto/user.dto';
import { UserRole } from './enums/role.enum';
import { UserRecentRecipesCustomRepository } from './user-recent-recipes.custom-repository';
import { UserRecipeBookmarkCustomRepository } from './user-recipe-bookmark.custom-repository';

@Injectable()
export class UserService {
  private readonly logger: CustomLoggerService;

  constructor(
    private readonly loggerFactory: LoggerFactoryService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRecipeBookmark)
    private readonly userRecipeBookmarkRepository: Repository<UserRecipeBookmark>,
    @InjectRepository(UserCompletedRecipe)
    private readonly userCompletedRecipeRepository: Repository<UserCompletedRecipe>,
    @InjectRepository(Recipe)
    private readonly recipeRepository: Repository<Recipe>,
    @InjectRepository(UserRecentRecipes)
    private readonly userRecentRecipesRepository: Repository<UserRecentRecipes>,
    @InjectRepository(UserDailyConditions)
    private readonly userDailyConditionsRepository: Repository<UserDailyConditions>,
    private readonly userRecipeBookmarkCustomRepository: UserRecipeBookmarkCustomRepository,
    private readonly userRecentRecipesCustomRepository: UserRecentRecipesCustomRepository,
    @InjectRepository(CommonCode)
    private readonly commonRepository: Repository<CommonCode>,
    private readonly socialLoginService: SocialLoginService,
    private readonly cacheService: CacheService,
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
  ) {
    this.logger = this.loggerFactory.create(UserService.name);
  }

  /**
   * 사용자 정보(email)로 새 유저를 생성합니다.
   */
  async createUser(email: string): Promise<User> {
    return this.userRepository.save({
      email,
      nickname: '닉네임',
      profileImageUrl: '',
      recipeCompleteCount: 0,
      isFirstEntry: true,
      role: UserRole.GENERAL,
    });
  }

  /**
   * 사용자 ID로 사용자 정보를 조회합니다.
   */
  async findById(id: number): Promise<UserDto | null> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      return null;
    }

    const role = await this.commonRepository.findOne({
      where: { code: user.role },
    });

    // 소셜 로그인 플랫폼 정보 조회
    const socialLogins = await this.socialLoginService.findByUserId(id);
    const platform =
      socialLogins.length > 0 ? socialLogins[0].platform : undefined;

    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      profileImageUrl: user.profileImageUrl,
      recipeCompleteCount: user.recipeCompleteCount,
      isFirstEntry: user.isFirstEntry,
      role: role.codeName,
      platform,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * 사용자가 레시피를 북마크합니다.
   */
  async createBookmark(
    userId: number,
    createBookmarkDto: CreateBookmarkDto,
  ): Promise<boolean> {
    const { recipeId } = createBookmarkDto;

    // 사용자 존재 여부 확인
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new CustomException(ERROR_CODES.USER_NOT_FOUND);
    }

    // 레시피 존재 여부 확인
    const recipe = await this.recipeRepository.findOne({
      where: { id: recipeId },
    });

    if (!recipe) {
      throw new CustomException(ERROR_CODES.RECIPE_NOT_FOUND);
    }

    // 이미 북마크한 레시피인지 확인
    const existingBookmark =
      await this.userRecipeBookmarkCustomRepository.existsByUserIdAndRecipeId(
        userId,
        recipeId,
      );

    if (existingBookmark) {
      throw new CustomException(ERROR_CODES.BOOKMARK_ALREADY_EXISTS);
    }

    // 북마크 생성
    await this.userRecipeBookmarkCustomRepository.save({
      userId: userId,
      recipeId: recipeId,
    });

    return true;
  }

  /**
   * 사용자의 북마크를 페이지네이션으로 조회합니다.
   */
  async getBookmarks(
    userId: number,
    query: GetBookmarksRequestDto,
  ): Promise<GetBookmarksResponseDto> {
    // 사용자 존재 여부 확인
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new CustomException(ERROR_CODES.USER_NOT_FOUND);
    }

    const { page, limit } = query;

    // 북마크와 레시피 정보를 페이지네이션으로 조회
    const paginationResult =
      await this.userRecipeBookmarkCustomRepository.findBookmarksWithRecipeByUserIdPaginated(
        userId,
        page,
        limit,
      );

    return paginationResult;
  }

  /**
   * 사용자가 레시피 북마크를 해제합니다.
   */
  async deleteBookmark(userId: number, recipeId: number): Promise<boolean> {
    // 사용자 존재 여부 확인
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new CustomException(ERROR_CODES.USER_NOT_FOUND);
    }

    // 북마크 존재 여부 확인
    const existingBookmark =
      await this.userRecipeBookmarkCustomRepository.existsByUserIdAndRecipeId(
        userId,
        recipeId,
      );

    if (!existingBookmark) {
      throw new CustomException(ERROR_CODES.BOOKMARK_NOT_FOUND);
    }

    // 북마크 삭제
    await this.userRecipeBookmarkRepository.delete({
      userId: userId,
      recipeId: recipeId,
    });

    return true;
  }

  /**
   * 유저의 보유 재료 설문을 처리합니다.
   * 사용자가 선택한 재료 ID들을 캐시에 저장합니다.
   */
  async saveUserIngredientsSurvey(
    userId: number,
    surveyDto: SaveUserIngredientsSurveyDto,
  ): Promise<SaveUserIngredientsSurveyResponseDto> {
    try {
      // 사용자 존재 여부 확인
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new CustomException(ERROR_CODES.USER_NOT_FOUND);
      }

      // 사용자가 선택한 재료 ID들
      const ingredientIds = surveyDto.ingredientIds;

      // 캐시에 저장 (TTL: 일주일)
      const cacheKey = `user:${userId}:owned_ingredients`;
      const ttl = 7 * 24 * 60 * 60; // 일주일 (초)

      await this.cacheService.set(cacheKey, JSON.stringify(ingredientIds), ttl);

      this.logger.log(
        `User ${userId} ingredients survey saved: ${ingredientIds.length} ingredients`,
      );

      return {
        ingredientIds: ingredientIds,
        cacheTtl: ttl,
        message: '보유 재료 설문이 완료되었습니다.',
      };
    } catch (error) {
      this.logger.error('보유 재료 설문 저장 중 에러 발생', error);
      if (error instanceof CustomException) {
        throw error;
      }
      throw new CustomException(ERROR_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 최근 본 레시피 추가
   * @param userId 유저 ID
   * @param recipeId 레시피 ID
   */
  async addRecentRecipe(userId: number, recipeId: number): Promise<boolean> {
    // 이미 존재하는지 확인
    const existingRecord = await this.userRecentRecipesRepository.findOne({
      where: {
        userId,
        recipeId,
      },
    });

    if (existingRecord) {
      // 이미 존재하면 삭제 후 새로 생성 (최신 순서 유지)
      await this.userRecentRecipesRepository.remove(existingRecord);
    }

    // 새 레코드 생성
    const userRecentRecipe = this.userRecentRecipesRepository.create({
      userId,
      recipeId,
    });

    await this.userRecentRecipesRepository.save(userRecentRecipe);
    return true;
  }

  /**
   * 최근 본 레시피 목록 조회 (최신순 20개)
   */
  async getRecentRecipes(
    userId: number,
    query: GetRecentRecipesRequestDto,
  ): Promise<GetRecentRecipesResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new CustomException(ERROR_CODES.USER_NOT_FOUND);
    }

    const { page, limit } = query;
    const result =
      await this.userRecentRecipesCustomRepository.findRecentRecipesWithRecipeByUserIdPaginated(
        userId,
        page,
        limit,
      );
    return result;
  }

  /**
   * 사용자가 레시피를 완료합니다.
   */
  async completeRecipe(userId: number, recipeId: number): Promise<boolean> {
    // 사용자 존재 여부 확인
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new CustomException(ERROR_CODES.USER_NOT_FOUND);
    }

    // 레시피 존재 여부 확인
    const recipe = await this.recipeRepository.findOne({
      where: { id: recipeId },
    });

    if (!recipe) {
      throw new CustomException(ERROR_CODES.RECIPE_NOT_FOUND);
    }

    // 기존 요리 시작 기록 확인
    const existing = await this.userCompletedRecipeRepository.findOne({
      where: { userId, recipeId },
    });

    if (existing) {
      // 이미 완료된 레시피인지 확인
      if (existing.isCompleted) {
        return true; // 이미 완료된 경우 true 반환
      }

      // 요리 시작 기록을 완료로 업데이트
      existing.isCompleted = true;
      await this.userCompletedRecipeRepository.save(existing);
    } else {
      // 요리 시작 기록이 없는 경우 오류 반환
      throw new CustomException(ERROR_CODES.RECIPE_COOKING_NOT_STARTED);
    }

    // 사용자 완료 횟수 증가
    user.recipeCompleteCount = (user.recipeCompleteCount || 0) + 1;
    await this.userRepository.save(user);

    // 완료 이력 기록
    await this.logCompletionHistory(userId, recipeId);

    return true;
  }

  /**
   * 사용자가 레시피 요리를 시작합니다.
   */
  async startRecipeCooking(userId: number, recipeId: number): Promise<boolean> {
    // 사용자 존재 여부 확인
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new CustomException(ERROR_CODES.USER_NOT_FOUND);
    }

    // 레시피 존재 여부 확인
    const recipe = await this.recipeRepository.findOne({
      where: { id: recipeId },
    });

    if (!recipe) {
      throw new CustomException(ERROR_CODES.RECIPE_NOT_FOUND);
    }

    // 이미 요리를 시작했는지 확인
    const existing = await this.userCompletedRecipeRepository.findOne({
      where: { userId, recipeId },
    });

    if (existing) {
      // 이미 요리를 시작했다면 기존 레코드 반환
      return true;
    }

    // 요리 시작 기록 생성 (isCompleted: false)
    const entity = this.userCompletedRecipeRepository.create({
      userId,
      recipeId,
      isCompleted: false,
      isReviewed: false,
    });
    await this.userCompletedRecipeRepository.save(entity);

    return true;
  }

  private async getUnavailableIngredients(
    userId: number,
    limit: number,
    offset: number,
  ): Promise<Array<{ id: number; name: string }>> {
    return this.userRepository.manager
      .createQueryBuilder(Ingredient, 'i')
      .innerJoin(
        'user_unavailable_ingredients',
        'uui',
        'uui.ingredient_id = i.id AND uui.user_id = :userId',
        { userId },
      )
      .select(['i.id AS id', 'i.name AS name'])
      .orderBy('i.name', 'ASC')
      .limit(limit)
      .offset(offset)
      .getRawMany<{ id: number; name: string }>();
  }

  /** public: paged response */
  async getUnavailableIngredientsPaged(
    userId: number,
    page = 1,
    limit = 20,
  ): Promise<{
    items: Array<{ id: number; name: string }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
    const offset = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
      this.getUnavailableIngredients(userId, safeLimit, offset),
      this.userRepository.manager
        .createQueryBuilder(Ingredient, 'i')
        .innerJoin(
          'user_unavailable_ingredients',
          'uui',
          'uui.ingredient_id = i.id AND uui.user_id = :userId',
          { userId },
        )
        .getCount(),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    return { items, total, page: safePage, limit: safeLimit, totalPages };
  }

  /**
   * Replace the user's unavailable-ingredients set with the provided list.
   * Strategy: delete all existing rows for the user, then bulk-insert the new list (if any).
   */
  async saveUnavailableIngredients(
    userId: number,
    dto: SaveUnavailableIngredientsDto,
  ): Promise<SaveUnavailableIngredientsResponseDto> {
    // Verify user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new CustomException(ERROR_CODES.USER_NOT_FOUND);

    // Deduplicate & coerce to positive integers
    const ids = Array.from(new Set(dto.ingredientIds ?? []))
      .map(Number)
      .filter((n) => Number.isInteger(n) && n > 0);

    // Delete all for this user
    await this.userRepository.query(
      'DELETE FROM user_unavailable_ingredients WHERE user_id = ?',
      [userId],
    );

    if (ids.length > 0) {
      // Build VALUES (?, ?), (?, ?), ... repeating userId for each row
      const values = ids.map(() => '(?, ?)').join(', ');
      const params = ids.flatMap((id) => [userId, id]);

      await this.userRepository.query(
        `INSERT INTO user_unavailable_ingredients (user_id, ingredient_id) VALUES ${values}`,
        params,
      );
    }

    return { savedCount: ids.length };
  }

  async getCompletedCount(userId: number): Promise<number> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new CustomException(ERROR_CODES.USER_NOT_FOUND);

    return this.userCompletedRecipeRepository.count({
      where: { userId, isCompleted: true },
    });
  }

  /** Write 1 row per completion event (even if already completed). */
  private async logCompletionHistory(
    userId: number,
    recipeId: number,
  ): Promise<void> {
    await this.userRepository.query(
      'INSERT INTO user_recipe_completion_history (user_id, recipe_id) VALUES (?, ?)',
      [userId, recipeId],
    );
  }

  /**
   * Returns total number of recipe completions for a user.
   * Uses the user_recipe_completion_history table (one row per completion).
   */
  async getTotalCompletionCount(userId: number): Promise<number> {
    // Ensure user exists (consistent with other endpoints)
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new CustomException(ERROR_CODES.USER_NOT_FOUND);

    // Raw count from history table (no entity required)
    const row = await this.userRepository.manager
      .createQueryBuilder()
      .select('COUNT(1)', 'count')
      .from('user_recipe_completion_history', 'h')
      .where('h.user_id = :userId', { userId })
      .getRawOne<{ count: string }>();

    return Number(row?.count ?? 0);
  }

  async getPendingReviews(
    userId: number,
  ): Promise<GetPendingReviewsResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new CustomException(ERROR_CODES.USER_NOT_FOUND);
    }

    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const completedRecipes = await this.userCompletedRecipeRepository.find({
      where: {
        userId,
        isCompleted: true,
        isReviewed: false,
        updatedAt: LessThan(twentyFourHoursAgo),
      },
      order: {
        updatedAt: 'DESC',
      },
    });

    const completedRecipeIds = completedRecipes.map((recipe) => recipe.id);

    return {
      totalCount: completedRecipes.length,
      completedRecipeIds,
    };
  }

  /**
   * 유저의 컨디션을 저장
   */
  async saveUserCondition(
    userId: number,
    dto: SaveUserConditionDto,
  ): Promise<SaveUserConditionResponseDto> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (!user) {
        throw new CustomException(ERROR_CODES.USER_NOT_FOUND);
      }
      const { conditionId, isRecommendationStarted } = dto;
      const cacheKey = `user:${userId}:daily_condition`;
      const ttl = 24 * 60 * 60 * 1000; // 24시간 (밀리초)
      const cachedData = {
        conditionId,
        savedAt: new Date().toISOString(),
      };
      await this.cacheService.set(cacheKey, JSON.stringify(cachedData), ttl);
      this.logger.log(
        `User ${userId} condition saved to cache: conditionId=${conditionId}`,
      );
      if (isRecommendationStarted) {
        let timeSlot: TimeSlot;
        const currentHour = new Date().getHours();
        if (currentHour >= 5 && currentHour < 12) {
          timeSlot = TimeSlot.MORNING;
        } else if (currentHour >= 12 && currentHour < 18) {
          timeSlot = TimeSlot.LUNCH;
        } else {
          timeSlot = TimeSlot.DINNER;
        }
        const userDailyCondition = this.userDailyConditionsRepository.create({
          userId,
          conditionId,
          date: new Date(),
          timeSlot,
        });
        await this.userDailyConditionsRepository.save(userDailyCondition);
        this.logger.log(
          `User ${userId} condition saved to database: conditionId=${conditionId}, timeSlot=${timeSlot}`,
        );
      }
      return {
        conditionId: conditionId,
      };
    } catch (error) {
      this.logger.error('사용자 컨디션 저장 중 에러 발생', error);
      if (error instanceof CustomException) {
        throw error;
      }
      throw new CustomException(ERROR_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 온보딩 완료 여부 업데이트
   */
  async completeOnboarding(userId: number): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new CustomException(ERROR_CODES.USER_NOT_FOUND);
    }
    if (!user.isFirstEntry) {
      this.logger.log(
        `User ${userId} already completed onboarding (isFirstEntry: false)`,
      );
      return true;
    }
    user.isFirstEntry = false;
    await this.userRepository.save(user);
    this.logger.log(`User ${userId} onboarding marked as complete`);
    return true;
  }

  /**
   * 유저의 컨디션을 조회
   */
  async getUserCondition(userId: number): Promise<GetUserConditionResponseDto> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (!user) {
        throw new CustomException(ERROR_CODES.USER_NOT_FOUND);
      }
      const cacheKey = `user:${userId}:daily_condition`;
      const cachedData = await this.cacheService.get(cacheKey);
      if (!cachedData) {
        this.logger.log(`User ${userId} condition not found in cache`);
        return {
          conditionId: null,
        };
      }
      let parsedData: { conditionId: number };
      try {
        parsedData = JSON.parse(cachedData);
      } catch {
        this.logger.warn(
          `User ${userId} has corrupted cache data, clearing cache`,
        );
        await this.cacheService.del(cacheKey);
        return {
          conditionId: null,
        };
      }
      if (!parsedData || typeof parsedData.conditionId !== 'number') {
        this.logger.warn(
          `User ${userId} has invalid cache data format: ${JSON.stringify(parsedData)}`,
        );
        await this.cacheService.del(cacheKey);
        return {
          conditionId: null,
        };
      }
      this.logger.log(
        `User ${userId} condition retrieved from cache: conditionId=${parsedData.conditionId}`,
      );
      return {
        conditionId: parsedData.conditionId,
      };
    } catch (error) {
      this.logger.error('사용자 컨디션 조회 중 에러 발생', error);
      if (error instanceof CustomException) {
        throw error;
      }
      throw new CustomException(ERROR_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 마이페이지 요약 정보를 조회합니다.
   */
  async getMyPageSummary(userId: number): Promise<MyPageSummaryDto> {
    try {
      // 사용자 프로필 조회
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new CustomException(ERROR_CODES.USER_NOT_FOUND);
      }

      // 통계 정보 조회
      const [savedCount, recentCount, cookedCount, unavailableCount] =
        await Promise.all([
          this.userRecipeBookmarkCustomRepository.countByUserId(userId),
          this.userRecentRecipesCustomRepository.countByUserId(userId),
          this.userCompletedRecipeRepository.count({
            where: { userId, isCompleted: true },
          }),
          this.getUnavailableIngredientsCount(userId),
        ]);

      // 저장된 레시피 조회 (최대 5개)
      const savedRecipes =
        await this.userRecipeBookmarkCustomRepository.findBookmarksWithRecipeByUserIdPaginated(
          userId,
          1,
          5,
        );

      // 최근 본 레시피 조회 (최대 5개)
      const recentRecipes =
        await this.userRecentRecipesCustomRepository.findRecentRecipesWithRecipeByUserIdPaginated(
          userId,
          1,
          5,
        );

      // 못 먹는 재료 조회 (최대 10개)
      const unavailableIngredients = await this.getUnavailableIngredients(
        userId,
        10,
        0,
      );

      return {
        profile: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          profileImageUrl: user.profileImageUrl,
          recipeCompleteCount: user.recipeCompleteCount,
          isFirstEntry: user.isFirstEntry,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        stats: {
          savedCount,
          recentCount,
          cookedCount,
          unavailableCount,
        },
        savedRecipes: savedRecipes.items.map((bookmark) => ({
          id: bookmark.recipeId,
          title: bookmark.recipeTitle,
          imageUrl: bookmark.recipeImages?.[0] || null,
        })),
        recentRecipes: recentRecipes.items.map((recent) => ({
          id: recent.recipeId,
          title: recent.recipeTitle,
          imageUrl: recent.recipeImages?.[0] || null,
        })),
        unavailableIngredients,
      };
    } catch (error) {
      this.logger.error('마이페이지 요약 조회 중 에러 발생', error);
      if (error instanceof CustomException) {
        throw error;
      }
      throw new CustomException(ERROR_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 못 먹는 재료 개수를 조회합니다.
   */
  private async getUnavailableIngredientsCount(
    userId: number,
  ): Promise<number> {
    const result = await this.userRepository.manager
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('user_unavailable_ingredients', 'uui')
      .where('uui.user_id = :userId', { userId })
      .getRawOne();

    return parseInt(result.count) || 0;
  }
}
