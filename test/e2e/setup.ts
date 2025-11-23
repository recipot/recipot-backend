import * as dotenv from 'dotenv';
import * as dotenvFlow from 'dotenv-flow';
import * as path from 'path';
import 'tsconfig-paths/register';

// 환경 변수 로드 (.env 파일들)
// .env.local을 우선적으로 로드
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });
dotenvFlow.config();

// 테스트 환경 변수 설정
process.env.NODE_ENV = 'test';

import {
  createTestDataSource,
  seedTestDatabase,
} from '../helpers/database.helper';

/**
 * 전역 테스트 설정
 * 테스트 시작 전에 test DB에 seed 데이터를 로드합니다.
 */
export default async () => {
  console.log('[TEST SETUP] 테스트 데이터베이스 초기화 시작...');

  try {
    // 테스트 DB 연결 생성
    const dataSource = await createTestDataSource();
    console.log('[TEST SETUP] 테스트 데이터베이스 연결 성공');

    // Seed 데이터 로드
    await seedTestDatabase(dataSource);
    console.log('[TEST SETUP] Seed 데이터 로드 완료');

    // DataSource는 전역 변수로 저장하여 테스트에서 사용할 수 있도록 함
    (global as any).testDataSource = dataSource;

    console.log('[TEST SETUP] 테스트 설정 완료');
  } catch (error) {
    console.error('[TEST SETUP] 테스트 설정 실패:', error);
    throw error;
  }
};
