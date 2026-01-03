import { IngredientCategory } from '@/database/entity/ingredient-category.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateIngredientCategoryDtoTx } from './dto/create-ingredient-category.dto';
import { CustomException } from '@/common/exceptions/custom-exception';
import { ERROR_CODES } from '@/common/constants/error-codes';
import { CacheService } from '@/common/cache/cache.service';
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
import { UserUnavailableIngredient } from '@/database/entity/user-unavailable-ingredient.entity';
import { GetRestrictedIngredientsResponseDto } from './dto/get-restricted-ingredients.dto';
import {
  GetAdminIngredientsDto,
  GetAdminIngredientsResponseDto,
} from './dto/get-admin-ingredients.dto';
import {
  DeleteAdminIngredientsDto,
  DeleteAdminIngredientsResponseDto,
} from './dto/delete-admin-ingredients.dto';

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
    @InjectRepository(UserUnavailableIngredient)
    private readonly userUnavailableIngredientRepository: Repository<UserUnavailableIngredient>,
    private readonly cacheService: CacheService,
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
   * @param userId 로그인 사용자 ID (비로그인 시 undefined)
   * @param guestSessionId 게스트 세션 ID (비로그인 시 사용)
   */
  async getIngredients(
    userId: number | undefined,
    guestSessionId: string | undefined,
  ): Promise<GetIngredientsResponseDto> {
    const ingredients = await this.ingredientRepository.find({
      order: { id: 'ASC' },
    });
    const categoryIds = [
      ...new Set(ingredients.map((i) => i.ingredientCategoryId)),
    ];
    const categories = await this.ingredientCategoryRepository.find({
      where: { id: In(categoryIds) },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    // 못먹는 재료 ID 조회: 로그인 시 DB, 게스트 시 캐시
    let unavailableIngredientIds: Set<number> = new Set();

    if (userId) {
      // 로그인 사용자: DB에서 조회
      const unavailableIngredients =
        await this.userUnavailableIngredientRepository.find({
          where: { userId },
          select: ['ingredientId'],
        });
      unavailableIngredientIds = new Set(
        unavailableIngredients.map((item) => item.ingredientId),
      );
    } else if (guestSessionId) {
      // 게스트 사용자: 캐시에서 조회
      const cacheKey = `guest:${guestSessionId}:unavailable_ingredients`;
      const cachedIds = await this.cacheService.get(cacheKey);
      if (cachedIds && Array.isArray(cachedIds)) {
        unavailableIngredientIds = new Set(cachedIds);
      }
    }

    return {
      data: ingredients.map((ingredient) => ({
        id: ingredient.id,
        name: ingredient.name,
        categoryId: ingredient.ingredientCategoryId,
        categoryName:
          categoryMap.get(ingredient.ingredientCategoryId) || '미분류',
        isUserRestricted: unavailableIngredientIds.has(ingredient.id),
      })),
    };
  }

  /**
   * 못먹는 음식 조회 (온보딩용)
   */
  async getRestrictedIngredients(
    userId: number,
  ): Promise<GetRestrictedIngredientsResponseDto> {
    const restrictedIngredients = await this.ingredientRepository.find({
      where: { isRestrictedIngredient: true },
      order: { id: 'ASC' },
    });

    // 카테고리 일괄 조회
    const categoryIds = [
      ...new Set(restrictedIngredients.map((i) => i.ingredientCategoryId)),
    ];
    const categories = await this.ingredientCategoryRepository.find({
      where: { id: In(categoryIds) },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    const unavailableIngredients =
      await this.userUnavailableIngredientRepository.find({
        where: { userId },
        select: ['ingredientId'],
      });
    const unavailableIngredientIds = new Set(
      unavailableIngredients.map((item) => item.ingredientId),
    );

    return {
      data: restrictedIngredients.map((ingredient) => ({
        id: ingredient.id,
        name: ingredient.name,
        categoryName:
          categoryMap.get(ingredient.ingredientCategoryId) || '미분류',
        isUserRestricted: unavailableIngredientIds.has(ingredient.id),
      })),
    };
  }

  /**
   * [어드민] 식재료 목록 조회 (페이지네이션)
   */
  async getAdminIngredients(
    query: GetAdminIngredientsDto,
  ): Promise<GetAdminIngredientsResponseDto> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    // 식재료 목록 조회 (페이지네이션)
    const [ingredients, total] = await this.ingredientRepository.findAndCount({
      order: { id: 'ASC' },
      take: limit,
      skip: skip,
    });

    // 카테고리 일괄 조회
    const categoryIds = [
      ...new Set(ingredients.map((i) => i.ingredientCategoryId)),
    ];
    const categories = await this.ingredientCategoryRepository.find({
      where: { id: In(categoryIds) },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    // 건강 정보 일괄 조회
    const ingredientIds = ingredients.map((i) => i.id);
    const healthInfos = await this.ingredientHealthInfoRepository.find({
      where: { ingredientId: In(ingredientIds) },
    });

    // 식재료별 건강 정보 그룹화
    const healthInfoMap = new Map<number, IngredientHealthInfo[]>();
    healthInfos.forEach((info) => {
      if (!healthInfoMap.has(info.ingredientId)) {
        healthInfoMap.set(info.ingredientId, []);
      }
      healthInfoMap.get(info.ingredientId).push(info);
    });

    return {
      data: ingredients.map((ingredient) => ({
        id: ingredient.id,
        name: ingredient.name,
        categoryName:
          categoryMap.get(ingredient.ingredientCategoryId) || '미분류',
        isRestrictedIngredient: ingredient.isRestrictedIngredient,
        healthInfos:
          healthInfoMap.get(ingredient.id)?.map((info) => ({
            content: info.content,
          })) || [],
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * [어드민] 식재료 다중 삭제
   */
  async deleteAdminIngredients(
    dto: DeleteAdminIngredientsDto,
  ): Promise<DeleteAdminIngredientsResponseDto> {
    // 존재하는 식재료 확인
    const existingIngredients = await this.ingredientRepository.find({
      where: { id: In(dto.ids) },
      select: ['id'],
    });

    const existingIds = existingIngredients.map((i) => i.id);
    const notFoundIds = dto.ids.filter((id) => !existingIds.includes(id));

    // 존재하지 않는 ID가 있으면 에러
    if (notFoundIds.length > 0) {
      throw new CustomException(ERROR_CODES.INGREDIENT_NOT_FOUND);
    }

    const result = await this.ingredientRepository.softDelete({
      id: In(dto.ids),
    });

    return {
      deletedCount: result.affected || 0,
    };
  }
}
