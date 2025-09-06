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

@Injectable()
export class IngredientService {
  private readonly logger = new Logger(IngredientService.name);

  constructor(
    @InjectRepository(IngredientCategory)
    private readonly ingredientCategoryRepository: Repository<IngredientCategory>,
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
}
