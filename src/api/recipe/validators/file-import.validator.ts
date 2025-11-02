import { ERROR_CODES } from '@/common/constants/error-codes';
import { EXCEL_COLUMNS } from '@/common/constants/excel-columns.constants';
import { CustomException } from '@/common/exceptions/custom-exception';
import { Condition } from '@/database/entity/condition.entity';
import { Ingredient } from '@/database/entity/ingredient.entity';
import { Seasoning } from '@/database/entity/seasoning.entity';
import { DIVISION } from '../constants/file-import.constants';
import { RecipeError } from '../types/file-import.types';

/**
 * 파일 임포트 관련 검증 유틸리티
 */
export class FileImportValidator {
  /**
   * 파일이 유효한 엑셀 파일인지 검증합니다.
   *
   * @param file 업로드된 파일
   * @throws CustomException 파일이 없거나 엑셀 파일이 아닌 경우
   */
  static validateExcelFile(file: Express.Multer.File): void {
    if (!file) {
      throw new CustomException({
        code: ERROR_CODES.VALIDATION_ERROR.code,
        message: '엑셀 파일이 필요합니다.',
      });
    }

    const isValidFile =
      file.mimetype.includes('spreadsheet') ||
      file.mimetype.includes('excel') ||
      file.originalname.endsWith('.xlsx') ||
      file.originalname.endsWith('.xls') ||
      file.originalname.endsWith('.xlsm');

    if (!isValidFile) {
      throw new CustomException({
        code: ERROR_CODES.VALIDATION_ERROR.code,
        message: '엑셀 파일만 업로드 가능합니다.',
      });
    }
  }

  /**
   * 조리 시간 문자열에서 숫자(분)를 추출합니다.
   * 문자열에서 앞부분의 숫자를 추출하여 분 단위 숫자로 반환합니다.
   *
   * @param durationText 조리 시간 문자열 (예: "5", "5분", "10 분")
   * @returns 추출된 분 단위 숫자
   * @throws CustomException 조리 시간이 없거나 형식이 올바르지 않은 경우
   *
   * @example
   * parseDurationMinutes("5") // -> 5
   * parseDurationMinutes("5분") // -> 5
   * parseDurationMinutes("10 분") // -> 10
   */
  static parseDurationMinutes(durationText: string): number {
    // 조리 시간이 없으면 에러 발생
    if (!durationText) {
      throw new CustomException({
        code: ERROR_CODES.VALIDATION_ERROR.code,
        message: '조리 시간이 필요합니다.',
      });
    }

    // 앞뒤 공백 제거
    const trimmed = durationText.trim();
    // 문자열 앞부분에서 숫자만 추출 (예: "5", "5분", "10 분" 등 모두 처리)
    const match = trimmed.match(/^(\d+)/);
    if (!match) {
      throw new CustomException({
        code: ERROR_CODES.VALIDATION_ERROR.code,
        message: `조리 시간 형식이 올바르지 않습니다: ${durationText}. 숫자만 입력하세요 (예: 5 또는 5분)`,
      });
    }

    // 추출한 숫자를 정수로 변환
    const minutes = parseInt(match[1], 10);
    // 숫자가 아니거나 0 이하면 에러 발생
    if (isNaN(minutes) || minutes <= 0) {
      throw new CustomException({
        code: ERROR_CODES.VALIDATION_ERROR.code,
        message: `조리 시간은 1 이상의 숫자여야 합니다: ${durationText}`,
      });
    }

    return minutes;
  }

  /**
   * 레시피 행 데이터의 필수 필드를 검증합니다.
   *
   * @param row 엑셀 행 데이터
   * @param rowNumber 행 번호 (에러 메시지용)
   * @param condition 컨디션 엔티티 (존재 여부 확인용, null이면 컨디션을 찾을 수 없음)
   * @returns 검증 결과 (통과 시 null, 실패 시 RecipeError 반환)
   */
  static validateRecipeRequiredFields(
    row: Record<string, any>,
    rowNumber: number,
    condition: Condition | null,
  ): RecipeError | null {
    // 제목 검증
    const title = row[EXCEL_COLUMNS.RECIPE.TITLE]
      ? String(row[EXCEL_COLUMNS.RECIPE.TITLE])
      : '';
    if (!title || !title.trim()) {
      return {
        row: rowNumber,
        title: title || '(제목 없음)',
        error: '레시피 타이틀이 없습니다.',
      };
    }

    // 조리 시간 검증
    const durationText = row[EXCEL_COLUMNS.RECIPE.DURATION]
      ? String(row[EXCEL_COLUMNS.RECIPE.DURATION])
      : '';
    if (!durationText || !durationText.trim()) {
      return {
        row: rowNumber,
        title,
        error: '조리 시간이 없습니다.',
      };
    }

    // 컨디션 이름 검증
    const conditionName = row[EXCEL_COLUMNS.RECIPE.CONDITION]
      ? String(row[EXCEL_COLUMNS.RECIPE.CONDITION])
      : '';
    if (!conditionName || !conditionName.trim()) {
      return {
        row: rowNumber,
        title,
        error: '유저 컨디션이 없습니다.',
      };
    }

    // 컨디션 존재 여부 검증
    if (!condition) {
      return {
        row: rowNumber,
        title,
        error: `컨디션 "${conditionName}"을 찾을 수 없습니다.`,
      };
    }

    // 한줄 카피 검증
    const description = row[EXCEL_COLUMNS.RECIPE.DESCRIPTION]
      ? String(row[EXCEL_COLUMNS.RECIPE.DESCRIPTION])
      : '';
    if (!description || !description.trim()) {
      return {
        row: rowNumber,
        title,
        error: '한줄 카피가 없습니다.',
      };
    }

    return null; // 모든 검증 통과
  }

  /**
   * 재료/양념 행 데이터의 필수 필드를 검증합니다.
   *
   * @param row 엑셀 행 데이터
   * @param rowNumber 행 번호 (에러 메시지용, 1부터 시작)
   * @param existingIngredient 이미 존재하는 재료 (null이면 존재하지 않음)
   * @param existingSeasoning 이미 존재하는 양념 (null이면 존재하지 않음)
   * @returns 검증 결과 (통과 시 null, 실패 시 에러 메시지 반환)
   */
  static validateIngredientOrSeasoningRow(
    row: Record<string, any>,
    rowNumber: number,
    existingIngredient: Ingredient | null,
    existingSeasoning: Seasoning | null,
  ): string | null {
    // 이름 검증
    const name = row[EXCEL_COLUMNS.INGREDIENT.NAME]?.trim();
    if (!name) {
      return `행 ${rowNumber}: 재료 이름이 없습니다.`;
    }

    // 구분 검증
    const division = row[EXCEL_COLUMNS.INGREDIENT.DIVISION]?.trim();
    if (division !== DIVISION.INGREDIENT && division !== DIVISION.SEASONING) {
      return `행 ${rowNumber}: 알 수 없는 구분 "${division}"입니다. (예상값: "${DIVISION.INGREDIENT}" 또는 "${DIVISION.SEASONING}")`;
    }

    // 식재료인 경우
    if (division === DIVISION.INGREDIENT) {
      // 이미 존재하는 재료인지 확인
      if (existingIngredient) {
        return `재료 "${name}"이 이미 존재합니다.`;
      }

      // 카테고리 검증 (식재료는 반드시 카테고리가 필요)
      const categoryName = row[EXCEL_COLUMNS.INGREDIENT.CATEGORY]?.trim();
      if (!categoryName) {
        return `행 ${rowNumber}: 재료 "${name}"의 카테고리가 지정되지 않았습니다.`;
      }
    }

    // 양념인 경우
    if (division === DIVISION.SEASONING) {
      // 이미 존재하는 양념인지 확인
      if (existingSeasoning) {
        return `양념 "${name}"이 이미 존재합니다.`;
      }
    }

    return null; // 모든 검증 통과
  }
}
