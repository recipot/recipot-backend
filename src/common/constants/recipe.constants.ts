/**
 * 레시피 추천 관련 상수
 */
export const RECOMMENDATION_CONFIG = {
  DEFAULT_TTL_SEC: 604800, // 1주일
  DEFAULT_PERSIST: true,
  LOCK_TTL_SEC: 3,
  BASED_ON_CODE: 'R10001', // TODO: 공통코드 조회로 대체
  // 락 대기 관련 설정
  MAX_WAIT_TIME_MS: 3000, // 최대 대기 시간 (락 TTL과 동일)
  POLL_INTERVAL_MS: 200, // 폴링 간격
} as const;
