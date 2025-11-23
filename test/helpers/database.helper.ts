import { DatabaseSeeder } from '@/database/seeds';
import * as path from 'path';
import { DataSource } from 'typeorm';

const TEST_DB_NAME = 'recipot_test';

function getDbConfig() {
  return {
    type: (process.env.DB_TYPE || 'mysql') as any,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: TEST_DB_NAME,
  };
}

export async function createTestDataSource(): Promise<DataSource> {
  const config = getDbConfig();
  const dataSource = new DataSource({
    ...config,
    entities: [
      path.join(__dirname, '../../src/database/entity', '*.entity.{ts,js}'),
    ],
    migrations: [
      path.join(__dirname, '../../src/database/migrations', '*.{ts,js}'),
    ],
    migrationsTableName: 'migrations_history',
    synchronize: false,
    logging: false,
  });

  await dataSource.initialize();
  await dataSource.runMigrations();

  return dataSource;
}

export async function seedTestDatabase(dataSource: DataSource): Promise<void> {
  const logger = {
    log: (msg: string) => console.log(`[TEST SEED] ${msg}`),
    error: (msg: string, err?: any) =>
      console.error(`[TEST SEED ERROR] ${msg}`, err),
  };
  await new DatabaseSeeder(dataSource, logger).run();
}

export async function cleanTestDatabase(dataSource: DataSource): Promise<void> {
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const entity of dataSource.entityMetadatas) {
    await dataSource.getRepository(entity.name).clear();
  }
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
}

export async function closeTestDataSource(
  dataSource: DataSource,
): Promise<void> {
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }
}
