import { EXCEL_COLUMNS } from '@/common/constants/excel-columns.constants';
import { IngredientOrSeasoningItem } from '../types/file-import.types';

/**
 * 재료/양념 파싱 관련 유틸리티 함수
 */
export class IngredientSeasoningParserUtil {
  /**
   * 재료/양념 문자열을 파싱합니다.
   * 쉼표로 구분된 문자열에서 각 재료/양념의 이름과 양을 추출합니다.
   * 마지막 공백을 기준으로 이름과 양을 분리합니다.
   *
   * @param text 파싱할 재료/양념 문자열
   * @returns 파싱된 재료/양념 아이템 배열
   *
   * @example
   * parseIngredientOrSeasoningString("땅콩버터 1T, 바나나 1개, 돼지고기 (대패삼겹살) 150g")
   * // -> [
   * //   { name: "땅콩버터", amount: "1T" },
   * //   { name: "바나나", amount: "1개" },
   * //   { name: "돼지고기 (대패삼겹살)", amount: "150g" }
   * // ]
   */
  static parseIngredientOrSeasoningString(
    text: string,
  ): IngredientOrSeasoningItem[] {
    // 빈 문자열이면 빈 배열 반환
    if (!text || !text.trim()) {
      return [];
    }

    const items: IngredientOrSeasoningItem[] = [];
    // 쉼표로 분리하고 각 부분의 앞뒤 공백 제거
    const parts = text.split(',').map((p) => p.trim());

    for (const part of parts) {
      // 빈 부분은 스킵
      if (!part) continue;

      // 마지막 공백을 기준으로 이름과 양을 분리
      // 예: "땅콩버터 1T" -> name: "땅콩버터", amount: "1T"
      // 예: "돼지고기 (대패삼겹살) 150g" -> name: "돼지고기 (대패삼겹살)", amount: "150g"
      const lastSpaceIndex = part.lastIndexOf(' ');
      if (lastSpaceIndex > 0) {
        // 마지막 공백 이전: 이름, 이후: 양
        const name = part.substring(0, lastSpaceIndex).trim();
        const amount = part.substring(lastSpaceIndex + 1).trim();
        // 이름과 양이 모두 있으면 추가
        if (name && amount) {
          items.push({ name, amount });
        } else {
          // 이름은 있지만 양이 없는 경우 (공백이 이름 안에 있는 경우)
          items.push({ name: part, amount: '' });
        }
      } else {
        // 공백이 없으면 전체를 이름으로 처리하고 양은 빈 문자열
        items.push({ name: part, amount: '' });
      }
    }

    return items;
  }

  /**
   * 엑셀 행 데이터에서 제한 재료 여부를 판단합니다.
   *
   * @param row 엑셀 행 데이터
   * @returns 제한 재료 여부
   */
  static parseRestrictedIngredientValue(row: Record<string, any>): boolean {
    const restrictedValue = row[EXCEL_COLUMNS.INGREDIENT.IS_RESTRICTED]?.trim();
    // 제한 재료 여부 판단: "o", "y", "true"만 true로 처리
    // "X"나 다른 값은 false로 처리하여 안전 재료로 분류
    const normalized = restrictedValue?.toLowerCase();
    return normalized === 'o' || normalized === 'y' || normalized === 'true';
  }

  /**
   * 재료 검증 후 RecipeError를 생성합니다.
   *
   * @param rowNumber 행 번호
   * @param title 레시피 제목
   * @param ingredientName 재료 이름
   * @returns RecipeError 객체
   */
  static createIngredientNotFoundError(
    rowNumber: number,
    title: string,
    ingredientName: string,
  ): { row: number; title: string; error: string } {
    return {
      row: rowNumber,
      title,
      error: `재료 "${ingredientName}"을 찾을 수 없습니다.`,
    };
  }

  /**
   * 양념 검증 후 RecipeError를 생성합니다.
   *
   * @param rowNumber 행 번호
   * @param title 레시피 제목
   * @param seasoningName 양념 이름
   * @returns RecipeError 객체
   */
  static createSeasoningNotFoundError(
    rowNumber: number,
    title: string,
    seasoningName: string,
  ): { row: number; title: string; error: string } {
    return {
      row: rowNumber,
      title,
      error: `양념 "${seasoningName}"을 찾을 수 없습니다.`,
    };
  }
}
