/**
 * 파일 임포트 관련 타입 정의
 */

/**
 * 재료 또는 양념 아이템 정보
 * 파싱된 재료/양념 문자열에서 추출한 개별 아이템을 나타냅니다.
 */
export interface IngredientOrSeasoningItem {
  /** 재료 또는 양념 이름 */
  name: string;
  /** 재료 또는 양념의 양 (예: "1T", "200g") */
  amount: string;
}

/**
 * 레시피 임포트 에러 정보
 * 레시피 임포트 중 발생한 에러 정보를 저장합니다.
 */
export interface RecipeError {
  /** 에러가 발생한 행 번호 */
  row: number;
  /** 레시피 제목 */
  title: string;
  /** 에러 메시지 */
  error: string;
}
