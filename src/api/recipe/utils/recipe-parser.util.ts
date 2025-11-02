import { Logger } from '@nestjs/common';

/**
 * 레시피 파싱 관련 유틸리티 함수
 */
export class RecipeParserUtil {
  /**
   * 조리도구 문자열을 파싱합니다.
   * 쉼표로 구분된 조리도구 이름 문자열을 배열로 변환합니다.
   *
   * @param text 파싱할 조리도구 문자열
   * @returns 조리도구 이름 배열
   *
   * @example
   * parseToolString("칼, 냄비") // -> ["칼", "냄비"]
   */
  static parseToolString(text: string): string[] {
    // 빈 문자열이면 빈 배열 반환
    if (!text || !text.trim()) {
      return [];
    }

    // 쉼표로 분리, 공백 제거, 빈 문자열 제거
    return text
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }

  /**
   * 레시피 이미지 URL 문자열을 파싱합니다.
   * 콤마로 구분된 이미지 URL 문자열을 객체 배열로 변환합니다.
   *
   * @param imagesText 이미지 URL 문자열 (콤마로 구분)
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

    // 콤마로 분리, 공백 제거, 빈 문자열 제거
    const imageUrls = imagesText
      .split(',')
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    // 이미지 URL 객체 배열로 변환
    return imageUrls.map((imageUrl) => ({ imageUrl }));
  }

  /**
   * 대체 불가능한 재료 목록을 파싱합니다.
   * 쉼표로 구분된 재료 이름 문자열을 배열로 변환합니다.
   *
   * @param nonAlternativeIngredientsText 대체 불가능한 재료 문자열 (쉼표로 구분)
   * @returns 재료 이름 배열
   *
   * @example
   * parseNonAlternativeIngredients("돼지고기, 닭고기")
   * // -> ["돼지고기", "닭고기"]
   */
  static parseNonAlternativeIngredients(
    nonAlternativeIngredientsText: string,
  ): string[] {
    if (
      !nonAlternativeIngredientsText ||
      !nonAlternativeIngredientsText.trim()
    ) {
      return [];
    }

    // 쉼표로 분리, 공백 제거, 빈 문자열 제거
    return nonAlternativeIngredientsText
      .split(',')
      .map((name) => name.trim())
      .filter((name) => name.length > 0);
  }

  /**
   * 엑셀 행 데이터에서 조리과정(step)을 파싱합니다.
   * 동적으로 생성된 step 컬럼들(1step 요약, 1step, 1step 이미지 등)을 찾아서 조리과정 배열로 변환합니다.
   *
   * @param row 엑셀 행 데이터
   * @param title 레시피 제목 (로그 메시지용)
   * @param logger 로거 인스턴스 (경고 메시지 출력용)
   * @returns 조리과정 배열 (orderNum, summary, content, imageUrl 포함)
   */
  static parseRecipeSteps(
    row: Record<string, any>,
    title: string,
    logger?: Logger,
  ): Array<{
    orderNum: number;
    summary: string;
    content: string;
    imageUrl?: string | null;
  }> {
    // 엑셀에서 step 컬럼은 동적으로 생성될 수 있으므로 모든 컬럼을 순회하여 찾아야 함
    const steps = [];
    // 단계 번호를 키로 하여 각 단계의 요약, 내용, 이미지를 저장하는 맵
    const stepMap = new Map<
      number,
      { summary: string; content: string; imageUrl: string | null }
    >();

    // 엑셀의 모든 컬럼을 순회하여 step 관련 컬럼 찾기
    for (const [columnName, value] of Object.entries(row)) {
      // 값이 없거나 빈 값이면 스킵
      if (value === null || value === undefined) continue;
      const valueStr = String(value).trim();
      if (!valueStr) continue;

      // {숫자}step 요약 패턴 찾기 (예: "1step 요약", "2step 요약")
      const summaryMatch = columnName.match(/^(\d+)step\s*요약$/);
      if (summaryMatch) {
        const stepNum = parseInt(summaryMatch[1], 10);
        // 해당 단계 번호의 맵 항목이 없으면 초기화
        if (!stepMap.has(stepNum)) {
          stepMap.set(stepNum, {
            summary: '',
            content: '',
            imageUrl: null,
          });
        }
        // 요약 내용 저장
        stepMap.get(stepNum)!.summary = valueStr;
      }

      // {숫자}step 패턴 찾기 (예: "1step", "2step") - 단계 내용
      const stepMatch = columnName.match(/^(\d+)step$/);
      if (stepMatch) {
        const stepNum = parseInt(stepMatch[1], 10);
        // 해당 단계 번호의 맵 항목이 없으면 초기화
        if (!stepMap.has(stepNum)) {
          stepMap.set(stepNum, {
            summary: '',
            content: '',
            imageUrl: null,
          });
        }
        // 단계 내용 저장
        stepMap.get(stepNum)!.content = valueStr;
      }

      // {숫자}step 이미지 패턴 찾기 (예: "1step 이미지", "2step 이미지")
      const stepImageMatch = columnName.match(/^(\d+)step\s*이미지$/);
      if (stepImageMatch) {
        const stepNum = parseInt(stepImageMatch[1], 10);
        // 해당 단계 번호의 맵 항목이 없으면 초기화
        if (!stepMap.has(stepNum)) {
          stepMap.set(stepNum, {
            summary: '',
            content: '',
            imageUrl: null,
          });
        }
        // 단계 이미지 URL 저장
        stepMap.get(stepNum)!.imageUrl = valueStr;
      }
    }

    // step 번호 순서대로 정렬하여 배열로 변환
    // 단계 번호를 오름차순으로 정렬
    const sortedStepNumbers = Array.from(stepMap.keys()).sort((a, b) => a - b);

    // 정렬된 단계 번호 순서대로 step 배열 생성
    for (const stepNum of sortedStepNumbers) {
      const stepData = stepMap.get(stepNum)!;
      const content = stepData.content.trim();
      const summary = stepData.summary.trim();
      const imageUrl = stepData.imageUrl?.trim();

      // content와 summary가 모두 있어야 step으로 인정
      // 둘 다 필수이므로 하나라도 없으면 해당 단계는 건너뜀
      if (content && summary) {
        steps.push({
          orderNum: stepNum, // 단계 순서 번호
          summary: summary, // 요약 (요약 열에서 가져옴)
          content, // 단계 상세 내용
          imageUrl, // 단계 이미지 URL (optional이므로 그대로 전달)
        });
      } else {
        // summary나 content가 없으면 스킵하고 로그 남기기
        if (logger) {
          if (!summary) {
            logger.warn(
              `레시피 "${title}"의 ${stepNum}단계: 요약이 없어 스킵되었습니다.`,
            );
          }
          if (!content) {
            logger.warn(
              `레시피 "${title}"의 ${stepNum}단계: 내용이 없어 스킵되었습니다.`,
            );
          }
        }
      }
    }

    return steps;
  }
}
