import { DataSource } from 'typeorm';
import { CommonCodeSeed } from './common-code.seed';
import { ConditionSeed } from './condition.seed';
import { IngredientSeed } from './ingredient.seed';
import { seedRecipeRecommendationCondition } from './recipe-recommendation-condition.seed';
import { RecipeSeed } from './recipe.seed';
import { SeasoningSeed } from './seasoning.seed';
import { ToolSeed } from './tool.seed';
import { UserSeed } from './user.seed';

export class DatabaseSeeder {
  constructor(
    private dataSource: DataSource,
    private logger: any,
  ) {}

  async run(): Promise<void> {
    this.logger.log('Starting database seeding...');

    // CommonCodeSeed 실행
    const commonCodeSeed = new CommonCodeSeed(this.dataSource);
    await commonCodeSeed.run();

    // UserSeed 실행
    const userSeed = new UserSeed(this.dataSource);
    await userSeed.run();

    // IngredientSeed 실행
    const ingredientSeed = new IngredientSeed(this.dataSource);
    await ingredientSeed.run();

    // SeasoningSeed 실행
    const seasoningSeed = new SeasoningSeed(this.dataSource);
    await seasoningSeed.run();

    // ToolSeed 실행
    const toolSeed = new ToolSeed(this.dataSource);
    await toolSeed.run();

    // ConditionSeed 실행
    const conditionSeed = new ConditionSeed(this.dataSource);
    await conditionSeed.run();

    // RecipeSeed 실행
    const recipeSeed = new RecipeSeed(this.dataSource);
    await recipeSeed.run();

    // RecipeRecommendationCondition 시드 실행
    await seedRecipeRecommendationCondition(this.dataSource);

    this.logger.log('All seeding completed successfully');
  }
}

// 개별 seeder들도 export
export { CommonCodeSeed, ConditionSeed, IngredientSeed, RecipeSeed, UserSeed };
