/**
 * 엑셀 데이터 정규화 유틸리티
 * 엑셀에서 읽은 데이터의 제어 문자나 특수 문자를 제거하고 정규화합니다.
 */
export class ExcelNormalizerUtil {
  /**
   * 엑셀에서 읽은 문자열 값을 정규화합니다.
   * 제어 문자, 특수 문자 패턴(_x0007_ 등), 불필요한 공백을 제거합니다.
   *
   * @param value 정규화할 값 (문자열 또는 다른 타입)
   * @returns 정규화된 문자열 값
   *
   * @example
   * normalizeExcelValue("식초_x0007__x0007__x0007_") // -> "식초"
   * normalizeExcelValue("  양념  ") // -> "양념"
   */
  static normalizeExcelValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    // 문자열로 변환
    let normalized = String(value);

    // _x0000_ ~ _x001F_ 패턴 제거 (제어 문자 패턴)
    // 엑셀에서 제어 문자를 _xXXXX_ 형식으로 표현함
    normalized = normalized.replace(/_x[0-9A-Fa-f]{4}_/g, '');

    // 일반 제어 문자 제거 (ASCII 0-31, 127)
    // eslint-disable-next-line no-control-regex
    normalized = normalized.replace(/[\x00-\x1F\x7F]/g, '');

    // 앞뒤 공백 제거
    normalized = normalized.trim();

    // 연속된 공백을 하나로 축소 (선택적)
    normalized = normalized.replace(/\s+/g, ' ');

    return normalized;
  }

  /**
   * 엑셀 행 데이터의 모든 값을 정규화합니다.
   *
   * @param row 엑셀 행 데이터 객체
   * @returns 정규화된 행 데이터 객체
   */
  static normalizeExcelRow(row: Record<string, any>): Record<string, any> {
    const normalized: Record<string, any> = {};
    for (const [key, value] of Object.entries(row)) {
      // 키도 정규화 (컬럼명의 제어 문자 제거)
      const normalizedKey = this.normalizeExcelValue(key);
      // 값도 정규화
      normalized[normalizedKey] =
        typeof value === 'string' ? this.normalizeExcelValue(value) : value;
    }
    return normalized;
  }
}
