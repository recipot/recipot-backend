import { DatabaseSeeder } from '@/database/seeds';
import * as path from 'path';
import { DataSource } from 'typeorm';

/**
 * 테스트용 데이터베이스 설정 가져오기
 */
function getTestDbConfig() {
  const config = {
    type: (process.env.TEST_DB_TYPE || process.env.DB_TYPE || 'mysql') as any,
    host: process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost',
    port: process.env.TEST_DB_PORT
      ? Number(process.env.TEST_DB_PORT)
      : process.env.DB_PORT
        ? Number(process.env.DB_PORT)
        : 3306,
    username: process.env.TEST_DB_USERNAME || process.env.DB_USERNAME || 'root',
    password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD || '',
    database:
      process.env.TEST_DB_DATABASE || process.env.DB_DATABASE || 'recipot_test',
  };

  // 디버깅: 환경 변수 확인 (비밀번호는 마스킹)
  console.log('[TEST DB CONFIG]', {
    type: config.type,
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password ? '***' : '(empty)',
    database: config.database,
  });

  return config;
}

/**
 * 테스트용 데이터베이스 생성 (없으면 생성)
 */
export async function createTestDatabase(): Promise<void> {
  const config = getTestDbConfig();

  // DB 생성용 임시 연결 (database 없이 연결)
  const adminDataSource = new DataSource({
    type: config.type,
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    // database를 지정하지 않음
  });

  try {
    await adminDataSource.initialize();

    // DB가 없으면 생성
    await adminDataSource.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );

    console.log(`[TEST DB] 데이터베이스 생성/확인 완료: ${config.database}`);
  } finally {
    if (adminDataSource.isInitialized) {
      await adminDataSource.destroy();
    }
  }
}

/**
 * 테스트용 데이터베이스 연결 생성 및 Migration 실행
 */
export async function createTestDataSource(): Promise<DataSource> {
  const config = getTestDbConfig();

  // 먼저 DB 생성
  await createTestDatabase();

  const dataSource = new DataSource({
    type: config.type,
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
    entities: [
      path.join(__dirname, '../../src/database/entity', '*.entity.{ts,js}'),
    ],
    migrations: [
      path.join(__dirname, '../../src/database/migrations', '*.{ts,js}'),
    ],
    migrationsTableName: 'migrations_history',
    synchronize: false,
    logging: false, // 테스트 중 로깅 비활성화
  });

  await dataSource.initialize();

  // Migration 실행
  console.log('[TEST DB] Migration 실행 중...');
  await dataSource.runMigrations();
  console.log('[TEST DB] Migration 완료');

  return dataSource;
}

/**
 * 테스트용 데이터베이스에 seed 데이터 로드
 */
export async function seedTestDatabase(dataSource: DataSource): Promise<void> {
  const logger = {
    log: (message: string) => console.log(`[TEST SEED] ${message}`),
    error: (message: string, error?: any) =>
      console.error(`[TEST SEED ERROR] ${message}`, error),
  };

  const seeder = new DatabaseSeeder(dataSource, logger);
  await seeder.run();
}

/**
 * 테스트용 데이터베이스 정리 (모든 테이블 데이터 삭제)
 */
export async function cleanTestDatabase(dataSource: DataSource): Promise<void> {
  const entities = dataSource.entityMetadatas;

  // 외래 키 제약 조건 비활성화
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');

  for (const entity of entities) {
    const repository = dataSource.getRepository(entity.name);
    await repository.clear();
  }

  // 외래 키 제약 조건 활성화
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
}

/**
 * 테스트용 데이터베이스 삭제
 */
export async function dropTestDatabase(): Promise<void> {
  const config = getTestDbConfig();

  // DB 삭제용 임시 연결 (database 없이 연결)
  const adminDataSource = new DataSource({
    type: config.type,
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    // database를 지정하지 않음
  });

  try {
    await adminDataSource.initialize();

    // DB 삭제
    await adminDataSource.query(
      `DROP DATABASE IF EXISTS \`${config.database}\``,
    );

    console.log(`[TEST DB] 데이터베이스 삭제 완료: ${config.database}`);
  } catch (error) {
    console.error(`[TEST DB] 데이터베이스 삭제 실패:`, error);
    // 삭제 실패해도 계속 진행
  } finally {
    if (adminDataSource.isInitialized) {
      await adminDataSource.destroy();
    }
  }
}

/**
 * 테스트용 데이터베이스 연결 종료
 */
export async function closeTestDataSource(
  dataSource: DataSource,
): Promise<void> {
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }
}
