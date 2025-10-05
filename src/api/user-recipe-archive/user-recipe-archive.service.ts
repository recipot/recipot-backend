import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CacheService } from '@/common/cache/cache.service';
import { ERROR_CODES } from '@/common/constants/error-codes';
import { CustomException } from '@/common/exceptions/custom-exception';
import { CustomLoggerService } from '@/common/logger/custom-logger.service';
import { LoggerFactoryService } from '@/common/logger/logger-factory.service';
import { CommonCode } from '@/database/entity/common-code.entity';
import { Recipe } from '@/database/entity/recipe.entity';
import { UserCompletedRecipe } from '@/database/entity/user-completed-recipe.entity';
import { UserRecentRecipes } from '@/database/entity/user-recent-recipes.entity';
import { UserRecipeBookmark } from '@/database/entity/user-recipe-bookmark.entity';
import { User } from '@/database/entity/user.entity';

import { CreateBookmarkDto } from '@/api/user/dto/create-bookmark.dto';
import { GetBookmarksRequestDto } from '@/api/user/dto/get-bookmarks-request.dto';
import { GetBookmarksResponseDto } from '@/api/user/dto/get-bookmarks-response.dto';
import { GetCompletedRecipesRequestDto } from '@/api/user/dto/get-completed-recipes-request.dto';
import { GetCompletedRecipesResponseDto } from '@/api/user/dto/get-completed-recipes-response.dto';
import { GetRecentRecipesRequestDto } from '@/api/user/dto/get-recent-recipes-request.dto';
import { GetRecentRecipesResponseDto } from '@/api/user/dto/get-recent-recipes-response.dto';
import { UserCompletedRecipeCustomRepository } from '@/api/user/user-completed-recipe.custom-repository';
import { UserRecentRecipesCustomRepository } from '@/api/user/user-recent-recipes.custom-repository';
import { UserRecipeBookmarkCustomRepository } from '@/api/user/user-recipe-bookmark.custom-repository';
import { UserService } from '@/api/user/user.service';

@Injectable()
export class UserRecipeArchiveService {
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
    @InjectRepository(CommonCode)
    private readonly commonRepository: Repository<CommonCode>,
    private readonly cacheService: CacheService,
    private readonly userService: UserService,
    private readonly userRecentRecipesCustomRepository: UserRecentRecipesCustomRepository,
    private readonly userCompletedRecipeCustomRepository: UserCompletedRecipeCustomRepository,
  ) {
    this.logger = this.loggerFactory.create(UserRecipeArchiveService.name);
  }

  async createBookmark(
    userId: number,
    createBookmarkDto: CreateBookmarkDto,
  ): Promise<boolean> {
    const { recipeId } = createBookmarkDto;
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new CustomException(ERROR_CODES.USER_NOT_FOUND);

    const recipe = await this.recipeRepository.findOne({
      where: { id: recipeId },
    });
    if (!recipe) throw new CustomException(ERROR_CODES.RECIPE_NOT_FOUND);

    const existingBookmark =
      await this.userRecipeBookmarkCustomRepository.existsByUserIdAndRecipeId(
        userId,
        recipeId,
      );
    if (existingBookmark) {
      throw new CustomException(ERROR_CODES.BOOKMARK_ALREADY_EXISTS);
    }

    await this.userRecipeBookmarkCustomRepository.save({ userId, recipeId });
    return true;
  }

  async getBookmarks(
    userId: number,
    query: GetBookmarksRequestDto,
  ): Promise<GetBookmarksResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new CustomException(ERROR_CODES.USER_NOT_FOUND);

    const { page, limit } = query;
    return await this.userRecipeBookmarkCustomRepository.findBookmarksWithRecipeByUserIdPaginated(
      userId,
      page,
      limit,
    );
  }

  async deleteBookmark(userId: number, recipeId: number): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new CustomException(ERROR_CODES.USER_NOT_FOUND);

    const existingBookmark =
      await this.userRecipeBookmarkCustomRepository.existsByUserIdAndRecipeId(
        userId,
        recipeId,
      );
    if (!existingBookmark) {
      throw new CustomException(ERROR_CODES.BOOKMARK_NOT_FOUND);
    }

    await this.userRecipeBookmarkRepository.delete({ userId, recipeId });
    return true;
  }

  async addRecentRecipe(userId: number, recipeId: number): Promise<boolean> {
    const existingRecord = await this.userRecentRecipesRepository.findOne({
      where: { userId, recipeId },
    });
    if (existingRecord) {
      await this.userRecentRecipesRepository.remove(existingRecord);
    }
    const userRecentRecipe = this.userRecentRecipesRepository.create({
      userId,
      recipeId,
    });
    await this.userRecentRecipesRepository.save(userRecentRecipe);
    return true;
  }

  async getRecentRecipes(
    userId: number,
    query: GetRecentRecipesRequestDto,
  ): Promise<GetRecentRecipesResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new CustomException(ERROR_CODES.USER_NOT_FOUND);
    const { page, limit } = query;
    return await this.userRecentRecipesCustomRepository.findRecentRecipesWithRecipeByUserIdPaginated(
      userId,
      page,
      limit,
    );
  }

  async startRecipeCooking(userId: number, recipeId: number): Promise<boolean> {
    return this.userService.startRecipeCooking(userId, recipeId);
  }

  async completeRecipe(userId: number, recipeId: number): Promise<boolean> {
    return this.userService.completeRecipe(userId, recipeId);
  }

  async getCompletedRecipes(
    userId: number,
    query: GetCompletedRecipesRequestDto,
  ): Promise<GetCompletedRecipesResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new CustomException(ERROR_CODES.USER_NOT_FOUND);

    const { page, limit } = query;
    return await this.userCompletedRecipeCustomRepository.findCompletedRecipesWithRecipeByUserIdPaginated(
      userId,
      page,
      limit,
    );
  }
}
