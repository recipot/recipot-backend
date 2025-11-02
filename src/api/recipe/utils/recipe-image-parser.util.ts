import { EXCEL_COLUMNS } from '@/common/constants/excel-columns.constants';

/**
 * 레시피 이미지 파싱 관련 유틸리티 함수
 */
export class RecipeImageParserUtil {
  /**
   * 레시피 이미지 URL 문자열을 파싱합니다.
   * 쉼표로 구분된 이미지 URL 문자열을 객체 배열로 변환합니다.
   *
   * @param imagesText 이미지 URL 문자열 (쉼표로 구분)
   * @returns 이미지 URL 객체 배열
   *
   * @example
   * parseRecipeImages("https://image1.jpg, https://image2.jpg")
   * // -> [{ imageUrl: "https://image1.jpg" }, { imageUrl: "https://image2.jpg" }]
   */
  static parseRecipeImages(imagesText: string): Array<{ imageUrl: string }> {
    if (!imagesText || !imagesText.trim()) {
      return [];
    }

    // 쉼표로 분리, 공백 제거, 빈 문자열 제거
    const imageUrls = imagesText
      .split(',')
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    // 이미지 URL 객체 배열로 변환
    return imageUrls.map((imageUrl) => ({ imageUrl }));
  }

  /**
   * 엑셀 행 데이터에서 레시피 ID를 파싱합니다.
   *
   * @param row 엑셀 행 데이터
   * @returns 레시피 ID (파싱 실패 시 null)
   */
  static parseRecipeId(row: Record<string, any>): number | null {
    const recipeIdText = row[EXCEL_COLUMNS.RECIPE_IMAGE.ID] || '';
    if (!recipeIdText) {
      return null;
    }

    const trimmed = String(recipeIdText).trim();

    // 헤더 행 체크: "레시피 ID"라는 문자열이면 헤더 행으로 간주
    if (trimmed === EXCEL_COLUMNS.RECIPE_IMAGE.ID) {
      return null;
    }

    // 숫자로 파싱
    const recipeId = parseInt(trimmed, 10);

    // NaN이거나 0 이하면 null 반환 (헤더 행 또는 잘못된 데이터)
    if (isNaN(recipeId) || recipeId <= 0) {
      return null;
    }

    return recipeId;
  }

  /**
   * 엑셀 행 데이터에서 step 이미지를 파싱합니다.
   * 동적으로 생성된 step 이미지 컬럼들({숫자}step 이미지)을 찾아서 Map으로 변환합니다.
   *
   * @param row 엑셀 행 데이터
   * @returns Step 번호와 이미지 URL 맵 (각 step마다 하나의 이미지만)
   *
   * @example
   * parseStepImages({ "1step 이미지": "https://1.jpg", "2step 이미지": "https://2.jpg" })
   * // -> Map(2) { 1 => "https://1.jpg", 2 => "https://2.jpg" }
   */
  static parseStepImages(row: Record<string, any>): Map<number, string> {
    const stepImageMap = new Map<number, string>();

    // 엑셀의 모든 컬럼을 순회하여 step 이미지 컬럼 찾기
    for (const [columnName, value] of Object.entries(row)) {
      // 값이 없거나 빈 값이면 스킵
      if (value === null || value === undefined) continue;
      const valueStr = String(value).trim();
      if (!valueStr) continue;

      // {숫자}step 이미지 패턴 찾기 (예: "1step 이미지", "2step 이미지")
      const stepImageMatch = columnName.match(/^(\d+)step\s*이미지$/);
      if (stepImageMatch) {
        const stepNum = parseInt(stepImageMatch[1], 10);
        stepImageMap.set(stepNum, valueStr);
      }
    }

    return stepImageMap;
  }
}
