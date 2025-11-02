/**
 * 엑셀 파일 컬럼명 상수
 */
export const EXCEL_COLUMNS = {
  // 재료/양념 엑셀 컬럼명
  INGREDIENT: {
    NAME: '재료',
    DIVISION: '구분',
    CATEGORY: '대분류',
    IS_RESTRICTED: '못 먹는 재료 여부',
    COPY: '재료 한줄 카피',
  },
  // 레시피 엑셀 컬럼명
  RECIPE: {
    TITLE: '레시피 타이틀',
    IMAGES: '레시피 이미지',
    DURATION: '조리 시간',
    CONDITION: '유저 컨디션',
    DESCRIPTION: '한줄 카피',
    TOOLS: '조리도구',
    INGREDIENTS: '재료',
    NON_ALTERNATIVE_INGREDIENTS: '대체불가능 재료',
    SEASONINGS: '양념',
    // step 컬럼은 동적으로 처리: {숫자}step 요약, {숫자}step, {숫자}step 이미지 형식 (예: 1step 요약, 1step, 1step 이미지, 2step 요약, 2step, 2step 이미지, ...)
  },
  // 레시피 이미지 업데이트 엑셀 컬럼명
  RECIPE_IMAGE: {
    ID: '레시피 ID',
    IMAGES: '레시피 이미지',
    // step 이미지 컬럼은 동적으로 처리: {숫자}step 이미지 형식 (예: 1step 이미지, 2step 이미지, ...)
  },
} as const;
