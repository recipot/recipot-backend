import { DataSource } from 'typeorm';
import { IngredientCategory } from '../entity/ingredient-category.entity';
import { Ingredient } from '../entity/ingredient.entity';

export class IngredientRestrictedSeed {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    if (!this.dataSource || !this.dataSource.manager) {
      throw new Error('DataSource or manager is not available');
    }

    const categoryRepository =
      this.dataSource.manager.getRepository(IngredientCategory);
    const ingredientRepository =
      this.dataSource.manager.getRepository(Ingredient);

    const restrictedCount = await ingredientRepository.count({
      where: { isRestrictedIngredient: true },
    });

    if (restrictedCount > 0) {
      this.logger.log('Restricted ingredients already seeded, skipping...');
      return;
    }

    this.logger.log('Starting IngredientRestrictedSeed...');

    // 온보딩에 노출할 제한 식품 Set
    const restrictedIngredients = new Set([
      // 곡류
      '밀가루',
      '메밀',
      '부침가루',
      '면',
      '파스타',
      '만두',
      '빵',
      // 어패류 (신규)
      '참치',
      '고등어',
      '멸치',
      '오징어',
      '굴',
      '바지락',
      '연어',
      '새우',
      '홍합',
      // 유제품
      '우유',
      '버터',
      '치즈',
      '요거트',
      // 절임 및 발효식품
      '새우젓',
      '명란젓',
      '액젓',
      // 소스류
      '마요네즈',
      '마라',
      // 가공식품류
      '어묵',
      '게맛살',
      // 육류 및 계란 (신규 카테고리)
      '닭고기',
      '돼지고기',
      '쇠고기',
      '계란',
      '메추리알',
      '오리고기',
      '햄',
      '소시지',
      '베이컨',
      // 견과류 (신규 카테고리)
      '땅콩',
      '호두',
      '캐슈넛',
      '피스타치오',
      '잣',
      '땅콩버터',
      // 과일 (신규 카테고리)
      '복숭아',
      '사과',
      '배',
    ]);

    const newCategoriesWithIngredients = [
      {
        name: '육류 및 계란',
        ingredients: [
          '닭고기',
          '돼지고기',
          '쇠고기',
          '계란',
          '메추리알',
          '오리고기',
          '햄',
          '소시지',
          '베이컨',
        ],
      },
      {
        name: '견과류',
        ingredients: ['땅콩', '호두', '캐슈넛', '피스타치오', '잣', '땅콩버터'],
      },
      {
        name: '과일',
        ingredients: ['복숭아', '사과', '배'],
      },
    ];

    // 1. 새로운 카테고리 생성
    for (const categoryData of newCategoriesWithIngredients) {
      const existingCategory = await categoryRepository.findOneBy({
        name: categoryData.name,
      });

      if (existingCategory) {
        this.logger.log(`카테고리 '${categoryData.name}' 이미 존재, 스킵`);
        continue;
      }

      const category = await categoryRepository.save({
        name: categoryData.name,
      });

      const ingredients = categoryData.ingredients.map((ingredientName) => ({
        name: ingredientName,
        ingredientCategoryId: category.id,
        isRestrictedIngredient: true,
      }));

      await ingredientRepository.save(ingredients);
      this.logger.log(`카테고리 '${categoryData.name}' 생성 완료`);
    }

    // 2. 기존 카테고리에 신규 재료 추가 및 제한식품 플래그 업데이트
    const seafoodCategory = await categoryRepository.findOneBy({
      name: '어패류',
    });

    if (seafoodCategory) {
      const newSeafoodItems = ['연어', '새우', '홍합'];

      for (const ingredientName of newSeafoodItems) {
        const existingIngredient = await ingredientRepository.findOneBy({
          name: ingredientName,
          ingredientCategoryId: seafoodCategory.id,
        });

        if (!existingIngredient) {
          await ingredientRepository.save({
            name: ingredientName,
            ingredientCategoryId: seafoodCategory.id,
            isRestrictedIngredient: true,
          });
          this.logger.log(`어패류에 '${ingredientName}' 추가`);
        }
      }
    }

    // 3. 기존 모든 재료의 isRestrictedIngredient 플래그 업데이트
    const allIngredients = await ingredientRepository.find();

    for (const ingredient of allIngredients) {
      const shouldBeRestricted = restrictedIngredients.has(ingredient.name);

      if (ingredient.isRestrictedIngredient !== shouldBeRestricted) {
        ingredient.isRestrictedIngredient = shouldBeRestricted;
        await ingredientRepository.save(ingredient);
      }
    }

    this.logger.log('IngredientRestrictedSeed completed successfully');
  }

  private readonly logger = {
    log: (message: string) =>
      console.log(`[IngredientRestrictedSeed] ${message}`),
    error: (message: string) =>
      console.error(`[IngredientRestrictedSeed] ${message}`),
  };
}
