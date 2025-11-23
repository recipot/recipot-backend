import { DataSource } from 'typeorm';
import { CommonCodeSeed } from './common-code.seed';
import { ConditionSeed } from './condition.seed';
import { RecipeSeed } from './recipe.seed';
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

    // ConditionSeed 실행
    const conditionSeed = new ConditionSeed(this.dataSource);
    await conditionSeed.run();

    // UserSeed, RecipeSeed 실행 (테스트 환경에서만)
    if (process.env.NODE_ENV === 'test') {
      this.logger.log(
        'Running UserSeed and RecipeSeed for test environment...',
      );
      const userSeed = new UserSeed(this.dataSource);
      await userSeed.run();

      const recipeSeed = new RecipeSeed(this.dataSource);
      await recipeSeed.run();
    }

    this.logger.log('All seeding completed successfully');
  }
}

// 개별 seeder들도 export
export { CommonCodeSeed, ConditionSeed, RecipeSeed, UserSeed };
