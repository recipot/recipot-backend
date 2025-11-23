import { DataSource } from 'typeorm';
import { IngredientCategory } from '../entity/ingredient-category.entity';
import { Ingredient } from '../entity/ingredient.entity';
import { RecipeHealthPoint } from '../entity/recipe-health-point.entity';
import { RecipeImage } from '../entity/recipe-image.entity';
import { RecipeIngredient } from '../entity/recipe-ingredient.entity';
import { RecipeRecommendationCondition } from '../entity/recipe-recommendation-condition.entity';
import { RecipeSeasoning } from '../entity/recipe-seasoning.entity';
import { RecipeStep } from '../entity/recipe-step.entity';
import { RecipeTool } from '../entity/recipe-tool.entity';
import { Recipe } from '../entity/recipe.entity';
import { Seasoning } from '../entity/seasoning.entity';
import { Tool } from '../entity/tool.entity';

export class RecipeSeed {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    if (!this.dataSource || !this.dataSource.manager) {
      throw new Error('DataSource or manager is not available');
    }

    // 필수 데이터 확인 및 생성
    await this.ensurePrerequisites();

    const recipeRepository = this.dataSource.manager.getRepository(Recipe);
    const recipeImageRepository =
      this.dataSource.manager.getRepository(RecipeImage);
    const recipeIngredientRepository =
      this.dataSource.manager.getRepository(RecipeIngredient);
    const recipeSeasoningRepository =
      this.dataSource.manager.getRepository(RecipeSeasoning);
    const recipeToolRepository =
      this.dataSource.manager.getRepository(RecipeTool);
    const recipeStepRepository =
      this.dataSource.manager.getRepository(RecipeStep);
    const recipeHealthPointRepository =
      this.dataSource.manager.getRepository(RecipeHealthPoint);
    const recipeRecommendationConditionRepository =
      this.dataSource.manager.getRepository(RecipeRecommendationCondition);

    // 레시피 1: 고등어 구이
    const recipe1 = await this.createRecipe(recipeRepository, {
      title: '고등어 구이',
      description: '신선한 고등어를 간단하게 구워내는 레시피입니다.',
      duration: 30,
    });

    await this.createRecipeImage(recipeImageRepository, recipe1.id, [
      'https://example.com/recipe1-1.jpg',
      'https://example.com/recipe1-2.jpg',
    ]);

    await this.createRecipeIngredient(recipeIngredientRepository, recipe1.id, [
      { ingredientId: 1, amount: '1마리', isAlternative: false },
    ]);

    await this.createRecipeSeasoning(recipeSeasoningRepository, recipe1.id, [
      { seasoningId: 1, amount: '2큰술' },
    ]);

    await this.createRecipeTool(recipeToolRepository, recipe1.id, [1]);

    await this.createRecipeSteps(recipeStepRepository, recipe1.id, [
      {
        orderNum: 1,
        summary: '고등어를 손질합니다.',
        content: '고등어의 비늘과 내장을 제거하고 깨끗이 씻어주세요.',
        imageUrl: 'https://example.com/step1-1.jpg',
      },
      {
        orderNum: 2,
        summary: '팬에 기름을 두르고 고등어를 굽습니다.',
        content:
          '팬을 달구고 기름을 두른 후 고등어를 앞뒤로 노릇하게 구워주세요.',
        imageUrl: 'https://example.com/step1-2.jpg',
      },
    ]);

    await this.createRecipeHealthPoint(
      recipeHealthPointRepository,
      recipe1.id,
      [
        '고등어는 오메가3가 풍부합니다.',
        '뇌 건강에 좋은 DHA가 많이 함유되어 있습니다.',
      ],
    );

    await this.createRecipeRecommendationCondition(
      recipeRecommendationConditionRepository,
      recipe1.id,
      [{ conditionId: 1, priorityScore: 1.0 }],
    );

    // 레시피 2: 된장찌개
    const recipe2 = await this.createRecipe(recipeRepository, {
      title: '된장찌개',
      description: '구수한 된장찌개를 만드는 레시피입니다.',
      duration: 20,
    });

    await this.createRecipeImage(recipeImageRepository, recipe2.id, [
      'https://example.com/recipe2-1.jpg',
    ]);

    await this.createRecipeIngredient(recipeIngredientRepository, recipe2.id, [
      { ingredientId: 2, amount: '200g', isAlternative: false },
      { ingredientId: 3, amount: '100g', isAlternative: true },
    ]);

    await this.createRecipeSeasoning(recipeSeasoningRepository, recipe2.id, [
      { seasoningId: 2, amount: '3큰술' },
    ]);

    await this.createRecipeTool(recipeToolRepository, recipe2.id, [2]);

    await this.createRecipeSteps(recipeStepRepository, recipe2.id, [
      {
        orderNum: 1,
        summary: '된장을 풀어줍니다.',
        content: '물에 된장을 풀어서 국물을 만들어주세요.',
        imageUrl: null,
      },
      {
        orderNum: 2,
        summary: '재료를 넣고 끓입니다.',
        content: '준비한 재료를 넣고 끓여주세요.',
        imageUrl: null,
      },
    ]);

    await this.createRecipeHealthPoint(
      recipeHealthPointRepository,
      recipe2.id,
      ['된장은 발효식품으로 장 건강에 좋습니다.'],
    );

    await this.createRecipeRecommendationCondition(
      recipeRecommendationConditionRepository,
      recipe2.id,
      [{ conditionId: 2, priorityScore: 1.0 }],
    );

    // 레시피 3: 김치볶음밥
    const recipe3 = await this.createRecipe(recipeRepository, {
      title: '김치볶음밥',
      description: '간단하고 맛있는 김치볶음밥 레시피입니다.',
      duration: 15,
    });

    await this.createRecipeImage(recipeImageRepository, recipe3.id, [
      'https://example.com/recipe3-1.jpg',
    ]);

    await this.createRecipeIngredient(recipeIngredientRepository, recipe3.id, [
      { ingredientId: 4, amount: '1공기', isAlternative: false },
    ]);

    await this.createRecipeSeasoning(recipeSeasoningRepository, recipe3.id, [
      { seasoningId: 3, amount: '1큰술' },
    ]);

    await this.createRecipeTool(recipeToolRepository, recipe3.id, [1]);

    await this.createRecipeSteps(recipeStepRepository, recipe3.id, [
      {
        orderNum: 1,
        summary: '김치를 볶습니다.',
        content: '팬에 기름을 두르고 김치를 볶아주세요.',
        imageUrl: null,
      },
      {
        orderNum: 2,
        summary: '밥을 넣고 볶습니다.',
        content: '볶은 김치에 밥을 넣고 함께 볶아주세요.',
        imageUrl: null,
      },
    ]);

    await this.createRecipeHealthPoint(
      recipeHealthPointRepository,
      recipe3.id,
      ['김치는 비타민과 유산균이 풍부합니다.'],
    );

    await this.createRecipeRecommendationCondition(
      recipeRecommendationConditionRepository,
      recipe3.id,
      [{ conditionId: 3, priorityScore: 1.0 }],
    );
  }

  private async ensurePrerequisites(): Promise<void> {
    const ingredientCategoryRepository =
      this.dataSource.manager.getRepository(IngredientCategory);
    const ingredientRepository =
      this.dataSource.manager.getRepository(Ingredient);
    const seasoningRepository =
      this.dataSource.manager.getRepository(Seasoning);
    const toolRepository = this.dataSource.manager.getRepository(Tool);

    // IngredientCategory 생성
    let category1 = await ingredientCategoryRepository.findOne({
      where: { name: '해산물류' },
    });
    if (!category1) {
      category1 = ingredientCategoryRepository.create({ name: '해산물류' });
      await ingredientCategoryRepository.save(category1);
    }

    let category2 = await ingredientCategoryRepository.findOne({
      where: { name: '채소류' },
    });
    if (!category2) {
      category2 = ingredientCategoryRepository.create({ name: '채소류' });
      await ingredientCategoryRepository.save(category2);
    }

    // Ingredient 생성
    let ingredient1 = await ingredientRepository.findOne({
      where: { name: '고등어' },
    });
    if (!ingredient1) {
      ingredient1 = ingredientRepository.create({
        name: '고등어',
        ingredientCategoryId: category1.id,
        isRestrictedIngredient: false,
      });
      await ingredientRepository.save(ingredient1);
    }

    let ingredient2 = await ingredientRepository.findOne({
      where: { name: '두부' },
    });
    if (!ingredient2) {
      ingredient2 = ingredientRepository.create({
        name: '두부',
        ingredientCategoryId: category2.id,
        isRestrictedIngredient: false,
      });
      await ingredientRepository.save(ingredient2);
    }

    let ingredient3 = await ingredientRepository.findOne({
      where: { name: '애호박' },
    });
    if (!ingredient3) {
      ingredient3 = ingredientRepository.create({
        name: '애호박',
        ingredientCategoryId: category2.id,
        isRestrictedIngredient: false,
      });
      await ingredientRepository.save(ingredient3);
    }

    let ingredient4 = await ingredientRepository.findOne({
      where: { name: '밥' },
    });
    if (!ingredient4) {
      ingredient4 = ingredientRepository.create({
        name: '밥',
        ingredientCategoryId: category2.id,
        isRestrictedIngredient: false,
      });
      await ingredientRepository.save(ingredient4);
    }

    // Seasoning 생성
    let seasoning1 = await seasoningRepository.findOne({
      where: { name: '간장' },
    });
    if (!seasoning1) {
      seasoning1 = seasoningRepository.create({ name: '간장' });
      await seasoningRepository.save(seasoning1);
    }

    let seasoning2 = await seasoningRepository.findOne({
      where: { name: '된장' },
    });
    if (!seasoning2) {
      seasoning2 = seasoningRepository.create({ name: '된장' });
      await seasoningRepository.save(seasoning2);
    }

    let seasoning3 = await seasoningRepository.findOne({
      where: { name: '고춧가루' },
    });
    if (!seasoning3) {
      seasoning3 = seasoningRepository.create({ name: '고춧가루' });
      await seasoningRepository.save(seasoning3);
    }

    // Tool 생성
    let tool1 = await toolRepository.findOne({ where: { name: '팬' } });
    if (!tool1) {
      tool1 = toolRepository.create({
        name: '팬',
        imageUrl: 'https://example.com/pan.jpg',
      });
      await toolRepository.save(tool1);
    }

    let tool2 = await toolRepository.findOne({ where: { name: '냄비' } });
    if (!tool2) {
      tool2 = toolRepository.create({
        name: '냄비',
        imageUrl: 'https://example.com/pot.jpg',
      });
      await toolRepository.save(tool2);
    }

    // Condition은 이미 seed되어 있다고 가정
  }

  private async createRecipe(
    repository: any,
    data: { title: string; description: string; duration: number },
  ): Promise<Recipe> {
    const existing = await repository.findOne({ where: { title: data.title } });
    if (existing) {
      return existing;
    }

    const recipe = repository.create(data);
    return await repository.save(recipe);
  }

  private async createRecipeImage(
    repository: any,
    recipeId: number,
    imageUrls: string[],
  ): Promise<void> {
    for (const imageUrl of imageUrls) {
      const existing = await repository.findOne({
        where: { recipeId, imageUrl },
      });
      if (!existing) {
        const image = repository.create({ recipeId, imageUrl });
        await repository.save(image);
      }
    }
  }

  private async createRecipeIngredient(
    repository: any,
    recipeId: number,
    ingredients: Array<{
      ingredientId: number;
      amount: string;
      isAlternative: boolean;
    }>,
  ): Promise<void> {
    for (const ing of ingredients) {
      const existing = await repository.findOne({
        where: { recipeId, ingredientId: ing.ingredientId },
      });
      if (!existing) {
        const recipeIngredient = repository.create({
          recipeId,
          ingredientId: ing.ingredientId,
          amount: ing.amount,
          isAlternative: ing.isAlternative,
        });
        await repository.save(recipeIngredient);
      }
    }
  }

  private async createRecipeSeasoning(
    repository: any,
    recipeId: number,
    seasonings: Array<{ seasoningId: number; amount: string }>,
  ): Promise<void> {
    for (const sea of seasonings) {
      const existing = await repository.findOne({
        where: { recipeId, seasoningId: sea.seasoningId },
      });
      if (!existing) {
        const recipeSeasoning = repository.create({
          recipeId,
          seasoningId: sea.seasoningId,
          amount: sea.amount,
        });
        await repository.save(recipeSeasoning);
      }
    }
  }

  private async createRecipeTool(
    repository: any,
    recipeId: number,
    toolIds: number[],
  ): Promise<void> {
    for (const toolId of toolIds) {
      const existing = await repository.findOne({
        where: { recipeId, toolId },
      });
      if (!existing) {
        const recipeTool = repository.create({ recipeId, toolId });
        await repository.save(recipeTool);
      }
    }
  }

  private async createRecipeSteps(
    repository: any,
    recipeId: number,
    steps: Array<{
      orderNum: number;
      summary: string;
      content: string;
      imageUrl: string | null;
    }>,
  ): Promise<void> {
    for (const step of steps) {
      const existing = await repository.findOne({
        where: { recipeId, orderNum: step.orderNum },
      });
      if (!existing) {
        const recipeStep = repository.create({
          recipeId,
          orderNum: step.orderNum,
          summary: step.summary,
          content: step.content,
          imageUrl: step.imageUrl,
        });
        await repository.save(recipeStep);
      }
    }
  }

  private async createRecipeHealthPoint(
    repository: any,
    recipeId: number,
    contents: string[],
  ): Promise<void> {
    for (const content of contents) {
      const existing = await repository.findOne({
        where: { recipeId, content },
      });
      if (!existing) {
        const healthPoint = repository.create({ recipeId, content });
        await repository.save(healthPoint);
      }
    }
  }

  private async createRecipeRecommendationCondition(
    repository: any,
    recipeId: number,
    conditions: Array<{ conditionId: number; priorityScore: number }>,
  ): Promise<void> {
    for (const cond of conditions) {
      const existing = await repository.findOne({
        where: { recipeId, conditionId: cond.conditionId },
      });
      if (!existing) {
        const recommendationCondition = repository.create({
          recipeId,
          conditionId: cond.conditionId,
          priorityScore: cond.priorityScore,
        });
        await repository.save(recommendationCondition);
      }
    }
  }
}
