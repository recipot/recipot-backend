import { CacheService } from '@/common/cache/cache.service';
import { CustomLoggerService } from '@/common/logger/custom-logger.service';
import { LoggerFactoryService } from '@/common/logger/logger-factory.service';
import { CommonCode } from '@/database/entity/common-code.entity';
import { Recipe } from '@/database/entity/recipe.entity';
import { UserCompletedRecipe } from '@/database/entity/user-completed-recipe.entity';
import { UserRecipeBookmark } from '@/database/entity/user-recipe-bookmark.entity';
import { User } from '@/database/entity/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ERROR_CODES } from '../../common/constants/error-codes';
import { CustomException } from '../../common/exceptions/custom-exception';
import { BookmarkWithRecipeDto } from './dto/bookmark-with-recipe.dto';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { CreateRecipeCompletionRequestDto } from './dto/create-recipe-completion.dto';
import { GroupedBookmarksDto } from './dto/grouped-bookmarks.dto';
import {
  SaveUserIngredientsSurveyDto,
  SaveUserIngredientsSurveyResponseDto,
} from './dto/save-user-ingredients-survey.dto';
import { UserDto } from './dto/user.dto';
import { UserRole } from './enums/role.enum';
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
    private readonly userRecipeBookmarkCustomRepository: UserRecipeBookmarkCustomRepository,
    @InjectRepository(CommonCode)
    private readonly commonRepository: Repository<CommonCode>,
    private readonly cacheService: CacheService,
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

    this.logger.log(`사용자 ${userId}가 레시피 ${recipeId}를 북마크했습니다.`);

    return true;
  }

  /**
   * 사용자의 북마크를 날짜별로 그룹핑하여 조회합니다.
   */
  async getBookmarksByDate(userId: number): Promise<GroupedBookmarksDto[]> {
    // 사용자 존재 여부 확인
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new CustomException(ERROR_CODES.USER_NOT_FOUND);
    }

    // 북마크와 레시피 정보를 함께 조회
    const bookmarks =
      await this.userRecipeBookmarkCustomRepository.findBookmarksWithRecipeByUserId(
        userId,
      );

    // 날짜별로 그룹핑
    const groupedBookmarks = new Map<string, BookmarkWithRecipeDto[]>();

    for (const bookmark of bookmarks) {
      const date = new Date(bookmark.createdAt).toISOString().split('T')[0]; // YYYY-MM-DD 형식

      const bookmarkDto: BookmarkWithRecipeDto = {
        id: bookmark.id,
        userId: bookmark.userId,
        recipeId: bookmark.recipeId,
        recipeTitle: bookmark.recipeTitle,
        recipeDescription: bookmark.recipeDescription,
        recipeImages: bookmark.recipeImages || [],
        createdAt: bookmark.createdAt,
      };

      if (!groupedBookmarks.has(date)) {
        groupedBookmarks.set(date, []);
      }
      groupedBookmarks.get(date)!.push(bookmarkDto);
    }

    // Map을 배열로 변환하고 날짜순으로 정렬
    const result: GroupedBookmarksDto[] = Array.from(groupedBookmarks.entries())
      .map(([date, bookmarks]) => ({
        date,
        bookmarks,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // 최신 날짜부터

    return result;
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
   * 사용자가 레시피를 완료합니다.
   */
  async completeRecipe(
    userId: number,
    createRecipeCompletionRequestDto: CreateRecipeCompletionRequestDto,
  ): Promise<boolean> {
    const { recipeId } = createRecipeCompletionRequestDto;

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

    // 이미 완료한 레시피인지 확인
    const existing = await this.userCompletedRecipeRepository.findOne({
      where: { userId, recipeId },
    });

    // TODO 기획 방향에 따라 수정 (기존 레시피 완료 시 중복 완료 가능한지)
    if (existing && existing.isCompleted) {
      return true;
    }

    // 완료 기록 생성 또는 업데이트
    if (existing) {
      existing.isCompleted = true;
      await this.userCompletedRecipeRepository.save(existing);
    } else {
      const entity = this.userCompletedRecipeRepository.create({
        userId,
        recipeId,
        isCompleted: true,
        isReviewed: false,
      });
      await this.userCompletedRecipeRepository.save(entity);
    }

    // 사용자 완료 횟수 증가
    user.recipeCompleteCount = (user.recipeCompleteCount || 0) + 1;
    await this.userRepository.save(user);

    return true;
  }
}
