import { DataSource } from 'typeorm';
import { IngredientCategory } from '../entity/ingredient-category.entity';
import { Ingredient } from '../entity/ingredient.entity';

export class IngredientSeed {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    if (!this.dataSource || !this.dataSource.manager) {
      throw new Error('DataSource or manager is not available');
    }

    const categoryRepository =
      this.dataSource.manager.getRepository(IngredientCategory);
    const ingredientRepository =
      this.dataSource.manager.getRepository(Ingredient);

    const existingCategoryCount = await categoryRepository.count();
    if (existingCategoryCount > 0) {
      console.log('IngredientCategory data already exists, skipping seed');
      return;
    }

    const categoriesWithIngredients = [
      {
        name: '곡류 및 주식',
        ingredients: [
          '백미',
          '현미',
          '흑미',
          '밀가루',
          '감자',
          '고구마',
          '메밀',
          '부침가루',
          '튀김가루',
          '전분',
          '쌀떡',
          '쌀국수',
          '라이스페이퍼',
          '밀떡',
          '면',
          '파스타',
          '만두',
          '빵',
        ],
      },
      {
        name: '채소류',
        ingredients: [
          '토마토',
          '양배추',
          '양파',
          '버섯',
          '호박',
          '당근',
          '배추',
          '무',
          '두부',
          '묵',
        ],
      },
      {
        name: '어패류',
        ingredients: ['참치', '고등어', '멸치', '오징어', '굴', '바지락'],
      },
      {
        name: '유제품',
        ingredients: ['우유', '버터', '치즈', '요거트'],
      },
      {
        name: '젓갈 및 발효식품',
        ingredients: ['새우젓', '오징어젓', '명란젓', '김치'],
      },
      {
        name: '소스류',
        ingredients: [
          '케첩',
          '마요네즈',
          '머스타드',
          '발사믹 식초',
          '샐러드 드레싱',
          '스파게티 소스',
        ],
      },
      {
        name: '가공식품류',
        ingredients: ['땅콩버터', '과일잼', '어묵', '게맛살'],
      },
    ];

    for (const categoryData of categoriesWithIngredients) {
      const category = await categoryRepository.save({
        name: categoryData.name,
      });
      const ingredients = categoryData.ingredients.map((ingredientName) => ({
        name: ingredientName,
        ingredient_category_id: category.id,
      }));
      await ingredientRepository.save(ingredients);
    }

    console.log('IngredientSeed executed successfully');
  }
}
