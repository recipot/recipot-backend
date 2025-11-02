/**
 * 파일 임포트 관련 상수 정의
 */

/**
 * 엑셀 파일의 구분 값
 * 재료/양념 엑셀에서 사용되는 구분 컬럼의 값입니다.
 */
export const DIVISION = {
  /** 식재료 구분 값 */
  INGREDIENT: '식재료',
  /** 양념 구분 값 */
  SEASONING: '양념',
} as const;

/**
 * 제한 재료 여부 값
 * 엑셀에서 "못 먹는 재료 여부" 컬럼에 사용되는 값입니다.
 */
export const RESTRICTED_VALUE = {
  /** 제한 재료 표시 (대문자) */
  YES: 'O',
  /** 제한 재료 표시 (소문자) */
  YES_LOWERCASE: 'o',
} as const;

/**
 * 엑셀 시트 이름 및 컬럼명
 * 스킵된 데이터 엑셀 파일 생성 시 사용되는 이름들입니다.
 */
export const EXCEL_SHEET_NAME = {
  /** 스킵된 데이터 시트 이름 */
  SKIPPED: '스킵된 데이터',
  /** 스킵 이유 컬럼명 */
  SKIP_REASON_COLUMN: '스킵 이유',
} as const;
