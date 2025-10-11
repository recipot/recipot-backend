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
import { Repository } from 'typeorm';
import { ERROR_CODES } from '../../common/constants/error-codes';
import { CustomException } from '../../common/exceptions/custom-exception';
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
import { Ingredient } from '@/database/entity/ingredient.entity';
import { RecipeImage } from '@/database/entity/recipe-image.entity';
import {
  MyPageIngredientDto,
  MyPageRecipeCardDto,
  MyPageSummaryDto,
} from '@/api/user/dto/my-page.dto';
import { IngredientCategory } from '@/database/entity/ingredient-category.entity';

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

    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      profileImageUrl: user.profileImageUrl,
      recipeCompleteCount: user.recipeCompleteCount,
      isFirstEntry: user.isFirstEntry,
      role: role.codeName,
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

    // TODO 기획 방향에 따라 수정 (기존 레시피 요리 시작 시 중복 요리 시작 가능한지)
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

  /** Internal: throw if user not found, returns your existing UserDto */
  private async getUserDtoOrThrow(id: number): Promise<UserDto> {
    const dto = await this.findById(id);
    if (!dto) throw new CustomException(ERROR_CODES.USER_NOT_FOUND);
    return dto;
  }

  /** Saved recipes preview (top N) via QueryBuilder */
  private async getSavedRecipesPreview(
    userId: number,
    limit = 3,
    offset = 0,
  ): Promise<MyPageRecipeCardDto[]> {
    const qb = this.recipeRepository
      .createQueryBuilder('r')
      .innerJoin(
        UserRecipeBookmark,
        'b',
        'b.recipeId = r.id AND b.userId = :userId',
        { userId },
      )
      .select(['r.id AS id', 'r.title AS title'])
      .addSelect(
        (sub) =>
          sub
            .select('ri.imageUrl')
            .from(RecipeImage, 'ri')
            .where('ri.recipeId = r.id')
            .orderBy('ri.id', 'ASC')
            .limit(1),
        'imageUrl',
      )
      .orderBy('b.id', 'DESC')
      .limit(limit)
      .offset(offset);

    return qb.getRawMany<MyPageRecipeCardDto>();
  }

  /** Recent recipes preview (top N) via QueryBuilder */
  private async getRecentRecipesPreview(
    userId: number,
    limit = 3,
    offset = 0,
  ): Promise<MyPageRecipeCardDto[]> {
    const qb = this.recipeRepository
      .createQueryBuilder('r')
      .innerJoin(
        UserRecentRecipes,
        'rr',
        'rr.recipeId = r.id AND rr.userId = :userId',
        { userId },
      )
      .select(['r.id AS id', 'r.title AS title'])
      .addSelect(
        (sub) =>
          sub
            .select('ri.imageUrl')
            .from(RecipeImage, 'ri')
            .where('ri.recipeId = r.id')
            .orderBy('ri.id', 'ASC')
            .limit(1),
        'imageUrl',
      )
      .orderBy('rr.id', 'DESC')
      .limit(limit)
      .offset(offset);

    return qb.getRawMany<MyPageRecipeCardDto>();
  }

  /** 못 먹는 음식 목록 (paged) via QueryBuilder; table-join for user_unavailable_ingredients */
  async getUnavailableIngredients(
    userId: number,
    limit = 20,
    offset = 0,
  ): Promise<MyPageIngredientDto[]> {
    const qb = this.ingredientRepository
      .createQueryBuilder('i')
      .innerJoin(
        'user_unavailable_ingredients',
        'uui',
        'uui.ingredient_id = i.id AND uui.user_id = :userId',
        { userId },
      )
      .leftJoin(IngredientCategory, 'ic', 'ic.id = i.ingredientCategoryId')
      .select(['i.id AS id', 'i.name AS name', 'ic.name AS categoryName'])
      .orderBy('i.name', 'ASC')
      .limit(limit)
      .offset(offset);

    return qb.getRawMany<MyPageIngredientDto>();
  }

  /** Counts using repositories/QB only */
  private async getCounts(userId: number): Promise<{
    savedCount: number;
    recentCount: number;
    cookedCount: number;
    unavailableCount: number;
  }> {
    const [savedCount, recentCount, cookedCount, unavailableCount] =
      await Promise.all([
        this.userRecipeBookmarkRepository.count({ where: { userId } }),
        this.userRecentRecipesRepository.count({ where: { userId } }),
        this.userCompletedRecipeRepository.count({
          where: { userId, isCompleted: true },
        }),
        this.ingredientRepository
          .createQueryBuilder('i')
          .innerJoin(
            'user_unavailable_ingredients',
            'uui',
            'uui.ingredient_id = i.id AND uui.user_id = :userId',
            { userId },
          )
          .getCount(),
      ]);

    return { savedCount, recentCount, cookedCount, unavailableCount };
  }

  async getMyPageSummary(userId: number): Promise<MyPageSummaryDto> {
    const profile = await this.getUserDtoOrThrow(userId);

    const [savedRecipes, recentRecipes, unavailableIngredients, stats] =
      await Promise.all([
        this.getSavedRecipesPreview(userId, 3, 0),
        this.getRecentRecipesPreview(userId, 3, 0),
        this.getUnavailableIngredients(userId, 8, 0),
        this.getCounts(userId),
      ]);

    return {
      profile,
      stats,
      savedRecipes,
      recentRecipes,
      unavailableIngredients,
    };
  }
}
