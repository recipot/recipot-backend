import { CacheService } from '@/common/cache/cache.service';
import { ERROR_CODES } from '@/common/constants/error-codes';
import { CustomException } from '@/common/exceptions/custom-exception';
import { Condition } from '@/database/entity/condition.entity';
import { IngredientHealthInfo } from '@/database/entity/ingredient-health-info.entity';
import { Ingredient } from '@/database/entity/ingredient.entity';
import { RecipeHealthPoint } from '@/database/entity/recipe-health-point.entity';
import { RecipeImage } from '@/database/entity/recipe-image.entity';
import { RecipeIngredient } from '@/database/entity/recipe-ingredient.entity';
import { RecipeRecommendationCondition } from '@/database/entity/recipe-recommendation-condition.entity';
import { RecipeSeasoning } from '@/database/entity/recipe-seasoning.entity';
import { RecipeStep } from '@/database/entity/recipe-step.entity';
import { RecipeTool } from '@/database/entity/recipe-tool.entity';
import { Recipe } from '@/database/entity/recipe.entity';
import { Seasoning } from '@/database/entity/seasoning.entity';
import { Tool } from '@/database/entity/tool.entity';
import { UserRecipeBookmark } from '@/database/entity/user-recipe-bookmark.entity';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { CommonCodeService } from '../common-code/common-code.service';
import { FileCleanupService } from '../file-cleanup/file-cleanup.service';
import { CreateRecipeDto, UpdateRecipeDto } from './dto/create-recipe.dto';
import {
  GetRecipeResponseDto,
  RecipeHealthPointDto,
  RecipeIngredientDto,
} from './dto/get-recipe.dto';
import { RecipeRecommendationService } from './services/recipe-recommendation.service';

interface RecipeIngredientDetail {
  ingredientId: number;
  name: string;
  amount: string;
  isAlternative: boolean;
}

@Injectable()
export class RecipeService {
  private readonly logger = new Logger(RecipeService.name);

  constructor(
    @InjectRepository(Recipe)
    private readonly recipeRepository: Repository<Recipe>,
    @InjectRepository(RecipeImage)
    private readonly recipeImageRepository: Repository<RecipeImage>,
    @InjectRepository(RecipeIngredient)
    private readonly recipeIngredientRepository: Repository<RecipeIngredient>,
    @InjectRepository(RecipeSeasoning)
    private readonly recipeSeasoningRepository: Repository<RecipeSeasoning>,
    @InjectRepository(RecipeTool)
    private readonly recipeToolRepository: Repository<RecipeTool>,
    @InjectRepository(RecipeStep)
    private readonly recipeStepRepository: Repository<RecipeStep>,
    @InjectRepository(RecipeHealthPoint)
    private readonly recipeHealthPointRepository: Repository<RecipeHealthPoint>,
    @InjectRepository(IngredientHealthInfo)
    private readonly ingredientHealthInfoRepository: Repository<IngredientHealthInfo>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
    @InjectRepository(Seasoning)
    private readonly seasoningRepository: Repository<Seasoning>,
    @InjectRepository(Tool)
    private readonly toolRepository: Repository<Tool>,
    @InjectRepository(RecipeRecommendationCondition)
    private readonly recipeRecommendationConditionRepository: Repository<RecipeRecommendationCondition>,
    @InjectRepository(UserRecipeBookmark)
    private readonly userRecipeBookmarkRepository: Repository<UserRecipeBookmark>,
    @InjectRepository(Condition)
    private readonly conditionRepository: Repository<Condition>,
    private readonly cacheService: CacheService,
    private readonly commonCodeService: CommonCodeService,
    private readonly recipeRecommendationService: RecipeRecommendationService,
    private readonly fileCleanupService: FileCleanupService,
  ) {}

  @Transactional()
  async createRecipe(createRecipeDto: CreateRecipeDto): Promise<Recipe> {
    try {
      const recipe = this.recipeRepository.create({
        title: createRecipeDto.title,
        description: createRecipeDto.description,
        duration: createRecipeDto.duration,
      });
      const savedRecipe = await this.recipeRepository.save(recipe);

      if (createRecipeDto.images && createRecipeDto.images.length > 0) {
        const recipeImages = createRecipeDto.images.map((imageDto) =>
          this.recipeImageRepository.create({
            recipeId: savedRecipe.id,
            imageUrl: imageDto.imageUrl,
          }),
        );
        await this.recipeImageRepository.save(recipeImages);
      }

      if (
        createRecipeDto.ingredients &&
        createRecipeDto.ingredients.length > 0
      ) {
        const recipeIngredients = createRecipeDto.ingredients.map(
          (ingredientDto) =>
            this.recipeIngredientRepository.create({
              recipeId: savedRecipe.id,
              ingredientId: ingredientDto.ingredientId,
              isAlternative: ingredientDto.isAlternative,
              amount: ingredientDto.amount,
            }),
        );
        await this.recipeIngredientRepository.save(recipeIngredients);
      }

      if (createRecipeDto.seasonings && createRecipeDto.seasonings.length > 0) {
        const recipeSeasonings = createRecipeDto.seasonings.map(
          (seasoningDto) =>
            this.recipeSeasoningRepository.create({
              recipeId: savedRecipe.id,
              seasoningId: seasoningDto.seasoningId,
              amount: seasoningDto.amount,
            }),
        );
        await this.recipeSeasoningRepository.save(recipeSeasonings);
      }

      if (createRecipeDto.tools && createRecipeDto.tools.length > 0) {
        const recipeTools = createRecipeDto.tools.map((toolDto) =>
          this.recipeToolRepository.create({
            recipeId: savedRecipe.id,
            toolId: toolDto.toolId,
          }),
        );
        await this.recipeToolRepository.save(recipeTools);
      }

      if (createRecipeDto.steps && createRecipeDto.steps.length > 0) {
        const recipeSteps = createRecipeDto.steps.map((stepDto) =>
          this.recipeStepRepository.create({
            recipeId: savedRecipe.id,
            orderNum: stepDto.orderNum,
            imageUrl: stepDto.imageUrl,
            summary: stepDto.summary,
            content: stepDto.content,
          }),
        );
        await this.recipeStepRepository.save(recipeSteps);
      }

      if (
        createRecipeDto.healthPoints &&
        createRecipeDto.healthPoints.length > 0
      ) {
        const recipeHealthPoints = createRecipeDto.healthPoints.map(
          (healthPointDto) =>
            this.recipeHealthPointRepository.create({
              recipeId: savedRecipe.id,
              content: healthPointDto.content,
            }),
        );
        await this.recipeHealthPointRepository.save(recipeHealthPoints);
      }

      // 컨디션별 가중치 저장
      if (createRecipeDto.conditionId) {
        // 모든 컨디션 조회
        const allConditions = await this.conditionRepository.find({
          order: { id: 'ASC' },
        });

        // 모든 컨디션에 대해 가중치 설정
        // 지정된 컨디션은 1.0, 나머지는 0.5
        const recipeRecommendationConditions = allConditions.map((condition) =>
          this.recipeRecommendationConditionRepository.create({
            recipeId: savedRecipe.id,
            conditionId: condition.id,
            priorityScore:
              condition.id === createRecipeDto.conditionId ? 1.0 : 0.5,
          }),
        );

        await this.recipeRecommendationConditionRepository.save(
          recipeRecommendationConditions,
        );
        this.logger.log(
          `레시피 ${savedRecipe.id}의 컨디션별 가중치 ${recipeRecommendationConditions.length}개 저장 완료`,
        );
      }

      const createdRecipe = await this.recipeRepository.findOne({
        where: { id: savedRecipe.id },
      });

      if (!createdRecipe) {
        throw new CustomException(ERROR_CODES.RECIPE_CREATE_FAILED);
      }

      // 레시피 생성 시 해당 레시피가 포함된 모든 추천 캐시 무효화
      // (새로 생성된 레시피가 추천 결과에 포함될 수 있으므로)
      await this.recipeRecommendationService.invalidateCacheByRecipeId(
        createdRecipe.id,
      );

      return createdRecipe;
    } catch (error) {
      this.logger.error('레시피 생성 중 에러 발생', error);
      throw new CustomException(ERROR_CODES.RECIPE_CREATE_FAILED);
    }
  }

  async getRecipe(
    userId: number,
    recipeId: number,
  ): Promise<GetRecipeResponseDto> {
    try {
      const recipe = await this.recipeRepository.findOne({
        where: { id: recipeId },
      });
      if (!recipe) {
        throw new CustomException(ERROR_CODES.RECIPE_NOT_FOUND);
      }

      const [
        images,
        recipeIngredients,
        recipeSeasonings,
        recipeTools,
        steps,
        userBookmark,
      ] = await Promise.all([
        this.recipeImageRepository.find({ where: { recipeId } }),
        this.recipeIngredientRepository.find({ where: { recipeId } }),
        this.recipeSeasoningRepository.find({ where: { recipeId } }),
        this.recipeToolRepository.find({ where: { recipeId } }),
        this.recipeStepRepository.find({ where: { recipeId } }),
        this.userRecipeBookmarkRepository.findOne({
          where: { userId, recipeId },
        }),
      ]);

      const ingredientIds = recipeIngredients.map((item) => item.ingredientId);
      const seasoningIds = recipeSeasonings.map((item) => item.seasoningId);
      const toolIds = recipeTools.map((item) => item.toolId);

      const [ingredients, seasonings, tools] = await Promise.all([
        ingredientIds.length
          ? this.ingredientRepository.find({ where: { id: In(ingredientIds) } })
          : [],
        seasoningIds.length
          ? this.seasoningRepository.find({ where: { id: In(seasoningIds) } })
          : [],
        toolIds.length
          ? this.toolRepository.find({ where: { id: In(toolIds) } })
          : [],
      ]);

      const ingredientMap = new Map<number, Ingredient>();
      ingredients.forEach((ingredient) =>
        ingredientMap.set(ingredient.id, ingredient),
      );

      const seasoningMap = new Map<number, Seasoning>();
      seasonings.forEach((seasoning) =>
        seasoningMap.set(seasoning.id, seasoning),
      );

      const toolMap = new Map<number, Tool>();
      tools.forEach((tool) => toolMap.set(tool.id, tool));

      const recipeIngredientsWithDetail: RecipeIngredientDetail[] =
        recipeIngredients.map((item) => ({
          ingredientId: item.ingredientId,
          name: ingredientMap.get(item.ingredientId)?.name ?? '',
          amount: item.amount,
          isAlternative: item.isAlternative,
        }));

      const userOwnedIngredients = await this.getUserOwnedIngredients(userId);
      const healthPoint = await this.getRandomHealthPoint(ingredientIds);

      return {
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        duration: recipe.duration,
        images: images.map((image) => ({
          id: image.id,
          imageUrl: image.imageUrl,
        })),
        ingredients: this.mapIngredientsWithOwnership(
          recipeIngredientsWithDetail,
          userOwnedIngredients,
        ),
        seasonings: recipeSeasonings.map((seasoning) => ({
          id: seasoning.seasoningId,
          name: seasoningMap.get(seasoning.seasoningId)?.name ?? '',
          amount: seasoning.amount,
        })),
        tools: recipeTools.map((tool) => ({
          id: tool.toolId,
          name: toolMap.get(tool.toolId)?.name ?? '',
          imageUrl: toolMap.get(tool.toolId)?.imageUrl ?? '',
        })),
        steps: steps
          .sort((a, b) => a.orderNum - b.orderNum)
          .map((step) => ({
            orderNum: step.orderNum,
            summary: step.summary,
            imageUrl: step.imageUrl,
          })),
        healthPoint,
        isBookmarked: !!userBookmark,
      };
    } catch (error) {
      this.logger.error('레시피 조회 중 에러 발생', error);
      // CustomException인 경우 그대로 전파 (예: INGREDIENT_HEALTH_INFO_NOT_FOUND)
      if (error instanceof CustomException) {
        throw error;
      }
      throw new CustomException(ERROR_CODES.RECIPE_GET_FAILED);
    }
  }

  private async getUserOwnedIngredients(userId: number): Promise<number[]> {
    try {
      const cacheKey = `user:${userId}:owned_ingredients`;
      const cachedIngredients = await this.cacheService.get(cacheKey);
      this.logger.log(
        `Cached ingredients for user ${userId}: ${cachedIngredients}`,
      );
      if (cachedIngredients) {
        if (typeof cachedIngredients === 'string') {
          return JSON.parse(cachedIngredients);
        }
      }
      return [];
    } catch (error) {
      this.logger.error('Failed to get cached ingredients', error);
      throw new CustomException(ERROR_CODES.RECIPE_GET_FAILED);
    }
  }

  /**
   * 레시피에 포함된 재료의 건강정보 중 랜덤으로 1개를 선택하여 반환합니다.
   * 건강 정보가 없을 경우, 기본 메시지를 반환합니다.
   */
  private async getRandomHealthPoint(
    ingredientIds: number[],
  ): Promise<RecipeHealthPointDto> {
    if (ingredientIds.length === 0) {
      throw new CustomException(
        ERROR_CODES.INGREDIENT_HEALTH_INFO_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    // 레시피 재료의 건강정보 조회
    const ingredientHealthInfos =
      await this.ingredientHealthInfoRepository.find({
        where: {
          ingredientId: In(ingredientIds),
        },
      });

    const validHealthInfos = ingredientHealthInfos.filter(
      (info) => info.content && info.content.trim().length > 0,
    );

    if (validHealthInfos.length === 0) {
      return {
        content:
          '그래도 가끔은 속세의 맛도 필요하잖아요...? 오늘만큼은 괜찮아요!',
      };
    }

    const randomIndex = Math.floor(Math.random() * validHealthInfos.length);
    const selectedHealthInfo = validHealthInfos[randomIndex];

    return {
      content: selectedHealthInfo.content,
    };
  }

  private mapIngredientsWithOwnership(
    recipeIngredients: RecipeIngredientDetail[],
    userOwnedIngredients: number[],
  ): RecipeIngredientDto {
    const ownedIngredientIds = userOwnedIngredients ?? [];

    const owned: RecipeIngredientDto['owned'] = [];
    const notOwned: RecipeIngredientDto['notOwned'] = [];
    const alternativeUnavailable: RecipeIngredientDto['alternativeUnavailable'] =
      [];

    recipeIngredients.forEach((ingredient) => {
      const ingredientItem = {
        id: ingredient.ingredientId,
        name: ingredient.name,
        amount: ingredient.amount,
        isAlternative: ingredient.isAlternative,
      };

      if (ownedIngredientIds.includes(ingredient.ingredientId)) {
        owned.push(ingredientItem);
      } else {
        notOwned.push(ingredientItem);
      }

      if (!ingredient.isAlternative) {
        alternativeUnavailable.push(ingredientItem);
      }
    });

    return {
      owned,
      notOwned,
      alternativeUnavailable,
    };
  }

  /**
   * 레시피 수정 - 기존 이미지(레시피 + 요리 단계) S3 파일 삭제 후 재생성
   */
  @Transactional()
  async updateRecipe(
    recipeId: number,
    updateRecipeDto: UpdateRecipeDto,
  ): Promise<Recipe> {
    try {
      // 1. 레시피 존재 여부 확인
      const recipe = await this.recipeRepository.findOne({
        where: { id: recipeId },
      });

      if (!recipe) {
        throw new CustomException(ERROR_CODES.RECIPE_NOT_FOUND);
      }

      // 2. 기본 정보 업데이트
      recipe.title = updateRecipeDto.title;
      recipe.description = updateRecipeDto.description;
      recipe.duration = updateRecipeDto.duration;
      const updatedRecipe = await this.recipeRepository.save(recipe);

      // 3. 기존 이미지 S3 파일 삭제 (새 이미지 추가 전에)
      await this.deleteExistingRecipeImages(recipeId);

      // 4. 기존 단계 이미지 S3 파일 삭제 (새 단계 추가 전에)
      await this.deleteExistingRecipeStepImages(recipeId);

      // 5. 기존 관계 데이터 모두 삭제
      await Promise.all([
        this.recipeImageRepository.delete({ recipeId }),
        this.recipeIngredientRepository.delete({ recipeId }),
        this.recipeSeasoningRepository.delete({ recipeId }),
        this.recipeToolRepository.delete({ recipeId }),
        this.recipeStepRepository.delete({ recipeId }),
        this.recipeHealthPointRepository.delete({ recipeId }),
        this.recipeRecommendationConditionRepository.delete({ recipeId }),
      ]);

      this.logger.log(`레시피 ${recipeId}의 관계 데이터 삭제 완료`);

      // 6. 새로운 관계 데이터 생성
      // 6.1. 이미지 저장
      if (updateRecipeDto.images && updateRecipeDto.images.length > 0) {
        const recipeImages = updateRecipeDto.images.map((imageDto) =>
          this.recipeImageRepository.create({
            recipeId: updatedRecipe.id,
            imageUrl: imageDto.imageUrl,
          }),
        );
        await this.recipeImageRepository.save(recipeImages);
        this.logger.log(
          `레시피 ${recipeId}의 새 메인 이미지 ${recipeImages.length}개 저장 완료`,
        );
      }

      // 6.2. 재료 저장
      if (
        updateRecipeDto.ingredients &&
        updateRecipeDto.ingredients.length > 0
      ) {
        const recipeIngredients = updateRecipeDto.ingredients.map(
          (ingredientDto) =>
            this.recipeIngredientRepository.create({
              recipeId: updatedRecipe.id,
              ingredientId: ingredientDto.ingredientId,
              isAlternative: ingredientDto.isAlternative,
              amount: ingredientDto.amount,
            }),
        );
        await this.recipeIngredientRepository.save(recipeIngredients);
      }

      // 6.3. 양념 저장
      if (updateRecipeDto.seasonings && updateRecipeDto.seasonings.length > 0) {
        const recipeSeasonings = updateRecipeDto.seasonings.map(
          (seasoningDto) =>
            this.recipeSeasoningRepository.create({
              recipeId: updatedRecipe.id,
              seasoningId: seasoningDto.seasoningId,
              amount: seasoningDto.amount,
            }),
        );
        await this.recipeSeasoningRepository.save(recipeSeasonings);
      }

      // 6.4. 조리도구 저장
      if (updateRecipeDto.tools && updateRecipeDto.tools.length > 0) {
        const recipeTools = updateRecipeDto.tools.map((toolDto) =>
          this.recipeToolRepository.create({
            recipeId: updatedRecipe.id,
            toolId: toolDto.toolId,
          }),
        );
        await this.recipeToolRepository.save(recipeTools);
      }

      // 6.5. 요리 단계 저장 (단계 이미지 포함)
      if (updateRecipeDto.steps && updateRecipeDto.steps.length > 0) {
        const recipeSteps = updateRecipeDto.steps.map((stepDto) =>
          this.recipeStepRepository.create({
            recipeId: updatedRecipe.id,
            orderNum: stepDto.orderNum,
            imageUrl: stepDto.imageUrl,
            summary: stepDto.summary,
            content: stepDto.content,
          }),
        );
        await this.recipeStepRepository.save(recipeSteps);
        this.logger.log(
          `레시피 ${recipeId}의 새 단계 이미지 ${recipeSteps.length}개 저장 완료`,
        );
      }

      // 6.6. 건강 포인트 저장
      if (
        updateRecipeDto.healthPoints &&
        updateRecipeDto.healthPoints.length > 0
      ) {
        const recipeHealthPoints = updateRecipeDto.healthPoints.map(
          (healthPointDto) =>
            this.recipeHealthPointRepository.create({
              recipeId: updatedRecipe.id,
              content: healthPointDto.content,
            }),
        );
        await this.recipeHealthPointRepository.save(recipeHealthPoints);
      }

      // 6.7. 컨디션별 가중치 저장
      if (updateRecipeDto.conditionId) {
        const allConditions = await this.conditionRepository.find({
          order: { id: 'ASC' },
        });

        const recipeRecommendationConditions = allConditions.map((condition) =>
          this.recipeRecommendationConditionRepository.create({
            recipeId: updatedRecipe.id,
            conditionId: condition.id,
            priorityScore:
              condition.id === updateRecipeDto.conditionId ? 1.0 : 0.5,
          }),
        );

        await this.recipeRecommendationConditionRepository.save(
          recipeRecommendationConditions,
        );
        this.logger.log(
          `레시피 ${updatedRecipe.id}의 컨디션별 가중치 ${recipeRecommendationConditions.length}개 저장 완료`,
        );
      }

      this.logger.log(`레시피 ${recipeId} 수정 완료`);

      // 7. 캐시 무효화
      await this.recipeRecommendationService.invalidateCacheByRecipeId(
        updatedRecipe.id,
      );

      const finalRecipe = await this.recipeRepository.findOne({
        where: { id: updatedRecipe.id },
      });

      if (!finalRecipe) {
        throw new CustomException(ERROR_CODES.RECIPE_UPDATE_FAILED);
      }

      return finalRecipe;
    } catch (error) {
      this.logger.error('레시피 수정 중 에러 발생', error);
      if (error instanceof CustomException) {
        throw error;
      }
      throw new CustomException(ERROR_CODES.RECIPE_UPDATE_FAILED);
    }
  }

  /**
   * 기존 레시피 메인 이미지의 S3 파일 삭제
   * - RecipeImage 테이블에서 조회 후 S3 Key 추출
   * - FileCleanupService를 통해 삭제
   */
  private async deleteExistingRecipeImages(recipeId: number): Promise<void> {
    try {
      const existingImages = await this.recipeImageRepository.find({
        where: { recipeId },
      });

      if (existingImages.length === 0) {
        this.logger.log(`레시피 ${recipeId}의 기존 메인 이미지 없음`);
        return;
      }

      const s3KeysToDelete = existingImages
        .map((image) => this.extractS3KeyFromUrl(image.imageUrl))
        .filter(Boolean);

      if (s3KeysToDelete.length > 0) {
        this.logger.log(
          `레시피 ${recipeId}의 기존 메인 이미지 S3 파일 삭제 시작 (${s3KeysToDelete.length}개)`,
        );
        await this.fileCleanupService.deleteS3FilesByKeys(s3KeysToDelete);
      }
    } catch (error) {
      this.logger.error(
        `레시피 ${recipeId}의 기존 메인 이미지 삭제 실패`,
        error,
      );
      // 예외 발생 안 함 - 레시피 업데이트는 계속 진행
    }
  }

  /**
   * 기존 레시피 단계 이미지의 S3 파일 삭제
   * - RecipeStep 테이블에서 조회 후 S3 Key 추출
   * - FileCleanupService를 통해 삭제
   */
  private async deleteExistingRecipeStepImages(
    recipeId: number,
  ): Promise<void> {
    try {
      const existingSteps = await this.recipeStepRepository.find({
        where: { recipeId },
      });

      if (existingSteps.length === 0) {
        this.logger.log(`레시피 ${recipeId}의 기존 단계 이미지 없음`);
        return;
      }

      const s3KeysToDelete = existingSteps
        .map((step) => this.extractS3KeyFromUrl(step.imageUrl))
        .filter(Boolean);

      if (s3KeysToDelete.length > 0) {
        this.logger.log(
          `레시피 ${recipeId}의 기존 단계 이미지 S3 파일 삭제 시작 (${s3KeysToDelete.length}개)`,
        );
        await this.fileCleanupService.deleteS3FilesByKeys(s3KeysToDelete);
      }
    } catch (error) {
      this.logger.error(
        `레시피 ${recipeId}의 기존 단계 이미지 삭제 실패`,
        error,
      );
      // 예외 발생 안 함 - 레시피 업데이트는 계속 진행
    }
  }

  /**
   * ImageUrl을 S3 Key로 변환
   * 예) https://cdn.example.com/recipes/123/uuid.jpg → recipes/123/uuid.jpg
   */
  private extractS3KeyFromUrl(imageUrl: string): string {
    try {
      if (!imageUrl) return '';

      const cdnUrl = process.env.AWS_CDN_URL;

      if (cdnUrl && imageUrl.includes(cdnUrl)) {
        return imageUrl.replace(`${cdnUrl}/`, '');
      }

      if (imageUrl.includes('amazonaws.com')) {
        const url = new URL(imageUrl);
        return url.pathname.replace(/^\//, '');
      }

      return imageUrl;
    } catch (error) {
      this.logger.error(`S3 Key 추출 실패: ${imageUrl}`, error);
      return '';
    }
  }

  /**
   * 레시피 삭제 (Soft Delete)
   * 삭제 시 관련 추천 캐시를 무효화합니다.
   */
  @Transactional()
  async deleteRecipe(recipeId: number): Promise<void> {
    try {
      const recipe = await this.recipeRepository.findOne({
        where: { id: recipeId },
      });

      if (!recipe) {
        throw new CustomException(ERROR_CODES.RECIPE_NOT_FOUND);
      }

      // Soft delete 수행
      await this.recipeRepository.softDelete(recipeId);

      // 해당 레시피가 포함된 모든 추천 캐시 무효화
      await this.recipeRecommendationService.invalidateCacheByRecipeId(
        recipeId,
      );

      this.logger.log(`레시피 ${recipeId} 삭제 완료 및 캐시 무효화 완료`);
    } catch (error) {
      this.logger.error('레시피 삭제 중 에러 발생', error);
      if (error instanceof CustomException) {
        throw error;
      }
      throw new CustomException(ERROR_CODES.RECIPE_DELETE_FAILED);
    }
  }
}
