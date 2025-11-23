/**
 * 건강 설문 관련 상수
 */
export const HEALTH_SURVEY_CONSTANTS = {
  /**
   * effectCodes가 필수인 persistentIssueCode 목록
   * 이 코드들을 선택한 경우 effectCodes는 반드시 제공되어야 합니다.
   */
  REQUIRES_EFFECT_CODES: ['H01003'] as const,
} as const;
