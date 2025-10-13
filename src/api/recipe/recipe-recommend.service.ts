import { ERROR_CODES } from '@/common/constants/error-codes';
import { CustomException } from '@/common/exceptions/custom-exception';
import { Condition } from '@/database/entity/condition.entity';
import { RecipeRecommendationCondition } from '@/database/entity/recipe-recommendation-condition.entity';
import { Recipe } from '@/database/entity/recipe.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRecipeRecommendationConditionRequest } from './dto/create-recipe-recommend-request.dto';
import { GetRecipeRecommendationConditionsResponseDto } from './dto/get-recipe-recommends.dto';
import { RecipeRecommendationConditionResponseDto } from './dto/recipe-recommend-response.dto';
import { UpdateRecipeRecommendationConditionDto } from './dto/update-recipe-recommend.dto';

@Injectable()
export class RecipeRecommendationConditionService {
  private readonly logger = new Logger(
    RecipeRecommendationConditionService.name,
  );

  constructor(
    @InjectRepository(RecipeRecommendationCondition)
    private readonly recipeRecommendationConditionRepository: Repository<RecipeRecommendationCondition>,
    @InjectRepository(Recipe)
    private readonly recipeRepository: Repository<Recipe>,
    @InjectRepository(Condition)
    private readonly conditionRepository: Repository<Condition>,
  ) {}

  /**
   * 레시피 추천 컨디션 목록 조회
   */
  async getRecipeRecommendationConditions(): Promise<GetRecipeRecommendationConditionsResponseDto> {
    try {
      const [data, total] =
        await this.recipeRecommendationConditionRepository.findAndCount({
          order: {
            id: 'ASC',
          },
        });

      return {
        data: data.map((item) => ({
          id: item.id,
          recipeId: item.recipeId,
          conditionId: item.conditionId,
          priorityScore: item.priorityScore,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })),
        total,
      };
    } catch (error) {
      this.logger.error('레시피 추천 컨디션 목록 조회 중 에러 발생', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * 레시피 추천 컨디션 생성
   */
  async createRecipeRecommendationCondition(
    dto: CreateRecipeRecommendationConditionRequest,
  ): Promise<RecipeRecommendationConditionResponseDto[]> {
    // DTO 데이터 유효성 검사
    if (!dto || !Array.isArray(dto) || dto.length === 0) {
      throw new CustomException(ERROR_CODES.INVALID_REQUEST_DATA);
    }

    // 레시피 ID 유효성 검사
    const recipeIds = [...new Set(dto.map((item) => item.recipeId))];
    const existingRecipes = await this.recipeRepository.find({
      where: { id: recipeIds[0] as number },
    });

    if (existingRecipes.length === 0) {
      throw new CustomException(ERROR_CODES.RECIPE_NOT_FOUND);
    }

    // 컨디션 ID 유효성 검사
    const conditionIds = [...new Set(dto.map((item) => item.conditionId))];
    const existingConditions = await this.conditionRepository.find({
      where: { id: conditionIds[0] as number },
    });

    if (existingConditions.length === 0) {
      throw new CustomException(ERROR_CODES.CONDITION_NOT_FOUND);
    }

    // 중복 체크 (같은 레시피-컨디션 조합)
    for (const item of dto) {
      const existing =
        await this.recipeRecommendationConditionRepository.findOne({
          where: {
            recipeId: item.recipeId,
            conditionId: item.conditionId,
          },
        });

      if (existing) {
        throw new CustomException(
          ERROR_CODES.RECIPE_RECOMMENDATION_CONDITION_ALREADY_EXISTS,
        );
      }
    }

    const newItems = this.recipeRecommendationConditionRepository.create(dto);
    const savedItems =
      await this.recipeRecommendationConditionRepository.save(newItems);

    return savedItems.map((item) => ({
      id: item.id,
      recipeId: item.recipeId,
      conditionId: item.conditionId,
      priorityScore: item.priorityScore,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  }

  /**
   * 레시피 추천 컨디션 수정
   */
  async updateRecipeRecommendationCondition(
    id: number,
    dto: UpdateRecipeRecommendationConditionDto,
  ): Promise<RecipeRecommendationConditionResponseDto> {
    try {
      const existing =
        await this.recipeRecommendationConditionRepository.findOne({
          where: { id },
        });

      if (!existing) {
        throw new CustomException(
          ERROR_CODES.RECIPE_RECOMMENDATION_CONDITION_NOT_FOUND,
        );
      }

      await this.recipeRecommendationConditionRepository.update(id, dto);
      const updated =
        await this.recipeRecommendationConditionRepository.findOne({
          where: { id },
        });

      return {
        id: updated.id,
        recipeId: updated.recipeId,
        conditionId: updated.conditionId,
        priorityScore: updated.priorityScore,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    } catch (error) {
      this.logger.error('레시피 추천 컨디션 수정 중 에러 발생', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * 레시피 추천 컨디션 삭제
   */
  async deleteRecipeRecommendationCondition(id: number): Promise<void> {
    try {
      const existing =
        await this.recipeRecommendationConditionRepository.findOne({
          where: { id },
        });

      if (!existing) {
        throw new CustomException(
          ERROR_CODES.RECIPE_RECOMMENDATION_CONDITION_NOT_FOUND,
        );
      }

      await this.recipeRecommendationConditionRepository.delete(id);
    } catch (error) {
      this.logger.error('레시피 추천 컨디션 삭제 중 에러 발생', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}
