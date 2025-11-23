import 'tsconfig-paths/register';
import { closeTestDataSource } from '../helpers/database.helper';

/**
 * 전역 테스트 종료 처리
 * 테스트 종료 후 test DB 연결을 정리합니다.
 */
export default async () => {
  console.log('[TEST TEARDOWN] 테스트 데이터베이스 정리 시작...');

  try {
    const dataSource = (global as any).testDataSource;
    if (dataSource) {
      await closeTestDataSource(dataSource);
      console.log('[TEST TEARDOWN] 테스트 데이터베이스 연결 종료 완료');
    }
    console.log('[TEST TEARDOWN] 테스트 정리 완료');
  } catch (error) {
    console.error('[TEST TEARDOWN] 테스트 정리 실패:', error);
    // 정리 실패해도 테스트는 종료되도록 에러를 던지지 않음
  }
};
