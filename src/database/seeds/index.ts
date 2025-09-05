import { DataSource } from 'typeorm';
import { CommonCodeSeed } from './common-code.seed';
import { UserSeed } from './user.seed';
import { IngredientCategorySeed } from './ingredientcategory.seed';

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

    // IngredientCategorySeed 실행
    const ingredientCategorySeed = new IngredientCategorySeed(this.dataSource);
    await ingredientCategorySeed.run();

    this.logger.log('All seeding completed successfully');
  }
}

// 개별 seeder들도 export
export { CommonCodeSeed, UserSeed, IngredientCategorySeed };
