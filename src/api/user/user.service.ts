import { CacheService } from '@/common/cache/cache.service';
import { CustomLoggerService } from '@/common/logger/custom-logger.service';
import { LoggerFactoryService } from '@/common/logger/logger-factory.service';
import { CommonCode } from '@/database/entity/common-code.entity';
import { Recipe } from '@/database/entity/recipe.entity';
import { UserCompletedRecipe } from '@/database/entity/user-completed-recipe.entity';
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
import { GetRecentRecipesRequestDto } from './dto/get-recent-recipes-request.dto';
import { GetRecentRecipesResponseDto } from './dto/get-recent-recipes-response.dto';
import {
  SaveUserIngredientsSurveyDto,
  SaveUserIngredientsSurveyResponseDto,
} from './dto/save-user-ingredients-survey.dto';
import { UserDto } from './dto/user.dto';
import { UserRole } from './enums/role.enum';
import { UserRecentRecipesCustomRepository } from './user-recent-recipes.custom-repository';
import { UserRecipeBookmarkCustomRepository } from './user-recipe-bookmark.custom-repository';
import {
  SaveUnavailableIngredientsDto,
  SaveUnavailableIngredientsResponseDto,
} from '@/api/user/dto/save-unavailable-ingredients.dto';
import { GetPendingReviewsResponseDto } from './dto/get-pending-reviews.dto';
import { UserUnavailableIngredient } from '@/database/entity/user-unavailable-ingredient.entity';

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
    private readonly userRecipeBookmarkCustomRepository: UserRecipeBookmarkCustomRepository,
    private readonly userRecentRecipesCustomRepository: UserRecentRecipesCustomRepository,
    @InjectRepository(CommonCode)
    private readonly commonRepository: Repository<CommonCode>,
    private readonly socialLoginService: SocialLoginService,
    private readonly cacheService: CacheService,
  ) {
    this.logger = this.loggerFactory.create(UserService.name);
  }

  /** 사용자 정보(email)로 새 유저를 생성합니다. */
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

  /** 사용자 ID로 사용자 정보를 조회합니다. */
  async findById(id: number): Promise<UserDto | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) return null;

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
      role: role?.codeName ?? user.role,
      platform,
    };
  }

  /** 사용자가 레시피를 북마크합니다. */
  async createBookmark(
    userId: number,
    createBookmarkDto: CreateBookmarkDto,
  ): Promise<boolean> {
    const { recipeId } = createBookmarkDto;

    // 사용자, 레시피 존재 확인
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new CustomException(ERROR_CODES.USER_NOT_FOUND);

    const recipe = await this.recipeRepository.findOne({
      where: { id: recipeId },
    });
    if (!recipe) throw new CustomException(ERROR_CODES.RECIPE_NOT_FOUND);

    // 중복 체크
    const existing =
      await this.userRecipeBookmarkCustomRepository.existsByUserIdAndRecipeId(
        userId,
        recipeId,
      );
    if (existing)
      throw new CustomException(ERROR_CODES.BOOKMARK_ALREADY_EXISTS);

    await this.userRecipeBookmarkCustomRepository.save({ userId, recipeId });
    return true;
  }

  /** 사용자의 북마크를 페이지네이션으로 조회합니다. */
  async getBookmarks(
    userId: number,
    query: GetBookmarksRequestDto,
  ): Promise<GetBookmarksResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new CustomException(ERROR_CODES.USER_NOT_FOUND);

    const { page, limit } = query;
    return this.userRecipeBookmarkCustomRepository.findBookmarksWithRecipeByUserIdPaginated(
      userId,
      page,
      limit,
    );
  }

  /** 사용자가 레시피 북마크를 해제합니다. */
  async deleteBookmark(userId: number, recipeId: number): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new CustomException(ERROR_CODES.USER_NOT_FOUND);

    const existing =
      await this.userRecipeBookmarkCustomRepository.existsByUserIdAndRecipeId(
        userId,
        recipeId,
      );
    if (!existing) throw new CustomException(ERROR_CODES.BOOKMARK_NOT_FOUND);

    await this.userRecipeBookmarkRepository.delete({ userId, recipeId });
    return true;
  }

  /** 유저의 보유 재료 설문 저장 (캐시) */
  async saveUserIngredientsSurvey(
    userId: number,
    surveyDto: SaveUserIngredientsSurveyDto,
  ): Promise<SaveUserIngredientsSurveyResponseDto> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) throw new CustomException(ERROR_CODES.USER_NOT_FOUND);

      const ingredientIds = surveyDto.ingredientIds;
      const cacheKey = `user:${userId}:owned_ingredients`;
      const ttl = 7 * 24 * 60 * 60; // 1 week (seconds)

      await this.cacheService.set(cacheKey, JSON.stringify(ingredientIds), ttl);
      this.logger.log(
        `User ${userId} ingredients survey saved: ${ingredientIds.length} ingredients`,
      );

      return {
        ingredientIds,
        cacheTtl: ttl,
        message: '보유 재료 설문이 완료되었습니다.',
      };
    } catch (err) {
      this.logger.error('보유 재료 설문 저장 중 에러 발생', err);
      if (err instanceof CustomException) throw err;
      throw new CustomException(ERROR_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  /** 최근 본 레시피 추가 */
  async addRecentRecipe(userId: number, recipeId: number): Promise<boolean> {
    const existing = await this.userRecentRecipesRepository.findOne({
      where: { userId, recipeId },
    });
    if (existing) await this.userRecentRecipesRepository.remove(existing);

    const entity = this.userRecentRecipesRepository.create({
      userId,
      recipeId,
    });
    await this.userRecentRecipesRepository.save(entity);
    return true;
  }

  /** 최근 본 레시피 목록 조회 (페이지네이션) */
  async getRecentRecipes(
    userId: number,
    query: GetRecentRecipesRequestDto,
  ): Promise<GetRecentRecipesResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new CustomException(ERROR_CODES.USER_NOT_FOUND);

    const { page, limit } = query;
    return this.userRecentRecipesCustomRepository.findRecentRecipesWithRecipeByUserIdPaginated(
      userId,
      page,
      limit,
    );
  }

  /** 사용자가 레시피를 완료합니다. */
  async completeRecipe(userId: number, recipeId: number): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new CustomException(ERROR_CODES.USER_NOT_FOUND);

    const recipe = await this.recipeRepository.findOne({
      where: { id: recipeId },
    });
    if (!recipe) throw new CustomException(ERROR_CODES.RECIPE_NOT_FOUND);

    const existing = await this.userCompletedRecipeRepository.findOne({
      where: { userId, recipeId },
    });

    if (existing) {
      if (existing.isCompleted) {
        // 이미 완료: 중복 완료 히스토리만 적재
        await this.logCompletionHistory(userId, recipeId);
        return true;
      }

      // 첫 완료 전환
      existing.isCompleted = true;
      await this.userCompletedRecipeRepository.save(existing);

      // 고유 완료 횟수 +1 (첫 완료 시에만)
      user.recipeCompleteCount = (user.recipeCompleteCount || 0) + 1;
      await this.userRepository.save(user);

      // 첫 완료 히스토리 적재
      await this.logCompletionHistory(userId, recipeId);
      return true;
    }

    // 시작 기록 없음
    throw new CustomException(ERROR_CODES.RECIPE_COOKING_NOT_STARTED);
  }

  /** 사용자가 레시피 요리를 시작합니다. */
  async startRecipeCooking(userId: number, recipeId: number): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new CustomException(ERROR_CODES.USER_NOT_FOUND);

    const recipe = await this.recipeRepository.findOne({
      where: { id: recipeId },
    });
    if (!recipe) throw new CustomException(ERROR_CODES.RECIPE_NOT_FOUND);

    const existing = await this.userCompletedRecipeRepository.findOne({
      where: { userId, recipeId },
    });
    if (existing) return true; // 중복 시작 허용 정책에 따라 반환

    const entity = this.userCompletedRecipeRepository.create({
      userId,
      recipeId,
      isCompleted: false,
      isReviewed: false,
    });
    await this.userCompletedRecipeRepository.save(entity);
    return true;
  }

  /**
   * Replace the user's unavailable-ingredients set with the provided list.
   * Strategy: delete all existing rows for the user, then bulk-insert the new list (if any).
   */
  async saveUnavailableIngredients(
    userId: number,
    dto: SaveUnavailableIngredientsDto,
  ): Promise<SaveUnavailableIngredientsResponseDto> {
    // 1) Verify user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new CustomException(ERROR_CODES.USER_NOT_FOUND);

    // 2) Deduplicate & coerce to positive integers
    const ids = Array.from(new Set(dto.ingredientIds ?? []))
      .map(Number)
      .filter((n) => Number.isInteger(n) && n > 0);

    // 3) Atomic replace inside a transaction
    await this.userRepository.manager.transaction(async (m) => {
      // delete old rows
      await m
        .createQueryBuilder()
        .delete()
        .from(UserUnavailableIngredient) // entity
        .where('user_id = :userId', { userId }) // raw column name is fine here
        .execute();

      // bulk insert new rows (if any)
      if (ids.length > 0) {
        await m
          .createQueryBuilder()
          .insert()
          .into(UserUnavailableIngredient) // entity
          .values(
            ids.map((ingredientId) => ({
              userId,
              ingredientId,
            })),
          )
          .orIgnore() // MySQL/MariaDB duplicate-safe (requires UNIQUE(user_id, ingredient_id))
          .execute();
      }
    });

    return { savedCount: ids.length };
  }
  /** Returns number of distinct recipes the user has completed at least once. */
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
   * Returns total number of recipe completion events for a user
   * (counts duplicates; uses user_recipe_completion_history).
   */
  async getTotalCompletionCount(userId: number): Promise<number> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new CustomException(ERROR_CODES.USER_NOT_FOUND);

    const row = await this.userRepository.manager
      .createQueryBuilder()
      .select('COUNT(1)', 'count')
      .from('user_recipe_completion_history', 'h')
      .where('h.user_id = :userId', { userId })
      .getRawOne<{ count: string }>();

    return Number(row?.count ?? 0);
  }

  /** Returns recipes completed (>=24h ago) that are not yet reviewed. */
  async getPendingReviews(
    userId: number,
  ): Promise<GetPendingReviewsResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new CustomException(ERROR_CODES.USER_NOT_FOUND);

    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const completedRecipes = await this.userCompletedRecipeRepository.find({
      where: {
        userId,
        isCompleted: true,
        isReviewed: false,
        updatedAt: LessThan(twentyFourHoursAgo),
      },
      order: { updatedAt: 'DESC' },
    });

    const completedRecipeIds = completedRecipes.map(
      (r: any) => r.recipeId ?? r.id,
    );

    return {
      totalCount: completedRecipes.length,
      completedRecipeIds,
    };
  }
}
