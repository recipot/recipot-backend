/**
 * 레시피 추천 관련 상수
 */
export const RECOMMENDATION_CONFIG = {
  DEFAULT_TTL_SEC: 604800, // 1주일
  DEFAULT_PERSIST: true,
  LOCK_TTL_SEC: 30, // 락 TTL (30초로 증가하여 긴 계산 시간을 고려)
  BASED_ON_CODE: 'R10001', // TODO: 공통코드 조회로 대체
  // 락 대기 관련 설정
  MAX_WAIT_TIME_MS: 35000, // 최대 대기 시간 (락 TTL보다 약간 길게 설정)
  POLL_INTERVAL_MS: 300, // 폴링 간격 (락 TTL 증가에 맞춰 조정)
} as const;
