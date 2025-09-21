import { IngredientCategory } from '@/database/entity/ingredient-category.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateIngredientCategoryDtoTx } from './dto/create-ingredient-category.dto';
import { CustomException } from '@/common/exceptions/custom-exception';
import { ERROR_CODES } from '@/common/constants/error-codes';
import {
  GetIngredientCategoriesDto,
  GetIngredientCategoriesResponseDto,
} from './dto/get-ingredient-category.dto';
import { Ingredient } from '@/database/entity/ingredient.entity';
import { IngredientHealthInfo } from '@/database/entity/ingredient-health-info.entity';
import {
  CreateIngredientDtoTx,
  IngredientResponseDto,
} from './dto/create-ingredient.dto';
import { GetIngredientsResponseDto } from './dto/get-ingredients.dto';

@Injectable()
export class IngredientService {
  private readonly logger = new Logger(IngredientService.name);

  constructor(
    @InjectRepository(IngredientCategory)
    private readonly ingredientCategoryRepository: Repository<IngredientCategory>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
    @InjectRepository(IngredientHealthInfo)
    private readonly ingredientHealthInfoRepository: Repository<IngredientHealthInfo>,
  ) {}

  /**
   * 재료 카테고리 생성
   */
  async createIngredientCategory(
    dto: CreateIngredientCategoryDtoTx,
  ): Promise<IngredientCategory[]> {
    const incomingNames = dto.data.map((element) => element.name);

    const existingCategories = await this.ingredientCategoryRepository.find({
      where: {
        name: In(incomingNames),
      },
    });

    if (existingCategories.length > 0) {
      throw new CustomException(ERROR_CODES.INGREDIENT_CATEGORY_ALREADY_EXISTS);
    }

    const newCategories = this.ingredientCategoryRepository.create(dto.data);
    return await this.ingredientCategoryRepository.save(newCategories);
  }

  /**
   * 재료 카테고리 조회
   */
  async getIngredientCategories(
    query: GetIngredientCategoriesDto,
  ): Promise<GetIngredientCategoriesResponseDto> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const data = await this.ingredientCategoryRepository.find({
      order: {
        id: 'ASC',
      },
      take: limit,
      skip: skip,
    });

    return {
      data: data.map((category) => ({
        id: category.id,
        name: category.name,
      })),
    };
  }

  /**
   * 재료 생성 (건강 정보 포함)
   */
  async createIngredient(
    dto: CreateIngredientDtoTx,
  ): Promise<IngredientResponseDto[]> {
    const results: IngredientResponseDto[] = [];

    for (const ingredientData of dto.data) {
      const category = await this.ingredientCategoryRepository.findOneBy({
        id: ingredientData.ingredient_category_id,
      });

      if (!category) {
        throw new CustomException(ERROR_CODES.INGREDIENT_CATEGORY_NOT_FOUND);
      }

      const existingIngredient = await this.ingredientRepository.findOneBy({
        name: ingredientData.name,
      });

      if (existingIngredient) {
        throw new CustomException(ERROR_CODES.INGREDIENT_ALREADY_EXISTS);
      }

      const newIngredient = this.ingredientRepository.create({
        ingredientCategoryId: ingredientData.ingredient_category_id,
        name: ingredientData.name,
      });

      const savedIngredient =
        await this.ingredientRepository.save(newIngredient);

      const healthInfos = ingredientData.health_infos.map((healthInfo) =>
        this.ingredientHealthInfoRepository.create({
          ingredientId: savedIngredient.id,
          content: healthInfo.content,
        }),
      );

      const savedHealthInfos =
        await this.ingredientHealthInfoRepository.save(healthInfos);

      results.push({
        id: savedIngredient.id,
        name: savedIngredient.name,
        ingredientCategoryId: savedIngredient.ingredientCategoryId,
        healthInfos: savedHealthInfos.map((info) => ({
          id: info.id,
          content: info.content,
        })),
      });
    }

    return results;
  }

  /**
   * 재료 목록 조회
   */
  async getIngredients(): Promise<GetIngredientsResponseDto> {
    const ingredients = await this.ingredientRepository.find({
      order: {
        id: 'ASC',
      },
    });

    return {
      data: ingredients.map((ingredient) => ({
        id: ingredient.id,
        name: ingredient.name,
      })),
    };
  }
}
