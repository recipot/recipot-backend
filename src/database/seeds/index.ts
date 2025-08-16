import { DataSource } from 'typeorm';
import { CommonCodeSeed } from './common-code.seed';

export class DatabaseSeeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    console.log('Starting database seeding...');

    // CommonCodeSeed 실행
    const commonCodeSeed = new CommonCodeSeed(this.dataSource);
    await commonCodeSeed.run();

    // 여기에 다른 seeder들을 추가할 수 있습니다
    // const userSeed = new UserSeed(this.dataSource);
    // await userSeed.run();

    console.log('All seeding completed successfully');
  }
}

// 개별 seeder들도 export
export { CommonCodeSeed };
