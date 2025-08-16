import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { DatabaseSeeder } from './seeds';

// 환경변수 로드
config();

async function seed() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'recipot',
    entities: [__dirname + '/entity/*.entity{.ts,.js}'],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    const seeder = new DatabaseSeeder(dataSource);
    await seeder.run();

    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('Database connection closed');
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  seed();
}
