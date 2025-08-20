import { config } from 'dotenv';
import { WinstonModule } from 'nest-winston';
import { DataSource } from 'typeorm';
import { winstonConfig } from '../common/logger/winston.config';
import { DatabaseSeeder } from './seeds';

// 환경변수 로드
config();

// Winston 로거 생성
const logger = WinstonModule.createLogger(winstonConfig);

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
    logger.log('Database connection established');

    const seeder = new DatabaseSeeder(dataSource, logger);
    await seeder.run();

    logger.log('Seeding completed successfully');
  } catch (error) {
    logger.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    logger.log('Database connection closed');
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  seed();
}
