export const ERROR_CODES = {
  // 유저 관련 오류
  USER_NOT_FOUND: { code: 'E1001', message: '사용자를 찾을 수 없습니다.' },
  BOOKMARK_ALREADY_EXISTS: { code: 'E1002', message: '이미 북마크한 레시피입니다.' },
  BOOKMARK_NOT_FOUND: { code: 'E1003', message: '북마크를 찾을 수 없습니다.' },
  RECIPE_COOKING_NOT_STARTED: { code: 'E1004', message: '요리를 시작하지 않은 레시피입니다.' },

  // 인증 및 로그인 오류
  AUTH_TOKEN_EXPIRED: { code: 'E2001', message: '인증 토큰이 만료되었습니다.' },
  AUTH_INVALID_TOKEN: { code: 'E2002', message: '유효하지 않은 토큰입니다.' },
  AUTH_REQUIRED: { code: 'E2005', message: '인증이 필요합니다.' },
  AUTH_INVALID_REFRESH_TOKEN: { code: 'E2006', message: '유효하지 않은 Refresh Token입니다.' },
  AUTH_REFRESH_TOKEN_EXPIRED: { code: 'E2007', message: 'Refresh Token이 만료되었습니다.' },
  AUTH_REFRESH_TOKEN_NOT_IN_REDIS: { code: 'E2008', message: 'Refresh Token이 Redis에 존재하지 않습니다.' },
  AUTH_ACCESS_TOKEN_NOT_IN_REDIS: { code: 'E2009', message: '토큰이 Redis에 존재하지 않습니다.' },
  AUTH_INVALID_ACCESS_TOKEN: { code: 'E2010', message: '유효하지 않은 Access Token입니다.' },
  AUTH_TOKEN_DECODE_FAILED: { code: 'E2011', message: '토큰을 디코드할 수 없습니다.' },
  AUTH_TOKEN_INFO_FAILED: { code: 'E2012', message: '토큰 정보를 확인할 수 없습니다.' },
  AUTH_TOKEN_NOT_PROVIDED: { code: 'E2013', message: '토큰이 제공되지 않았습니다.' },

  // 인가 오류
  AUTH_PERMISSION_DENIED: { code: 'E2014', message: '이 작업을 수행할 권한이 없습니다.' },

  // 공통 오류
  COMMON_CODE_ALREADY_EXISTS: { code: 'E3001', message: '이미 존재하는 공통 코드입니다.' },
  COMMON_CODE_NOT_FOUND: { code: 'E3002', message: '공통 코드를 찾을 수 없습니다.' },

  // 서버 오류
  INTERNAL_SERVER_ERROR: { code: 'E5000', message: '서버 내부 오류가 발생했습니다.' },

  // 유효성 검사 오류
  VALIDATION_ERROR: { code: 'E6001', message: '입력값이 유효하지 않습니다.' },
  INVALID_FORMAT: { code: 'E6003', message: '입력값 형식이 올바르지 않습니다.' },
  INVALID_REQUEST_DATA: { code: 'E6004', message: '요청 데이터가 유효하지 않습니다.' },

  // 파일 업로드 오류
  FILE_UPLOAD_FAILED: { code: 'E7003', message: '파일 업로드 중 오류가 발생했습니다.' },

  // 소셜 로그인 오류 (Kakao)
  KAKAO_USER_INFO_FAILED: { code: 'E9003', message: '카카오 사용자 정보 조회에 실패했습니다.' },
  INVALID_KAKAO_CODE: { code: 'E9006', message: '유효하지 않은 카카오 인가 코드입니다.' },
  KAKAO_SERVICE_UNAVAILABLE: { code: 'E9007', message: '카카오 서비스를 이용할 수 없습니다.' },
  KAKAO_LOGIN_PROCESS_ERROR: { code: 'E9008', message: '카카오 로그인 처리 중 오류가 발생했습니다.' },
  KAKAO_CONFIG_ERROR: { code: 'E9009', message: '카카오 설정이 올바르지 않습니다. 환경변수를 확인해주세요.' },

  // 소셜 로그인 오류 (Google)
  GOOGLE_USER_INFO_FAILED: { code: 'E9101', message: '구글 사용자 정보 조회에 실패했습니다.' },
  INVALID_GOOGLE_CODE: { code: 'E9102', message: '유효하지 않은 구글 인가 코드입니다.' },
  GOOGLE_TOKEN_FAILED: { code: 'E9103', message: '구글 액세스 토큰을 가져오지 못했습니다.' },
  GOOGLE_SERVICE_UNAVAILABLE: { code: 'E9104', message: '구글 서비스를 이용할 수 없습니다.' },
  GOOGLE_LOGIN_PROCESS_ERROR: { code: 'E9105', message: '구글 로그인 처리 중 오류가 발생했습니다.' },
  GOOGLE_CONFIG_ERROR: { code: 'E9106', message: '구글 설정이 올바르지 않습니다. 환경변수를 확인해주세요.' },
  GOOGLE_AUTH_FAILED: { code: 'E9107', message: '구글 인증에 실패했습니다.' },

  // 재료 관련 오류
  INGREDIENT_CATEGORY_ALREADY_EXISTS: { code: 'E10001', message: '이미 존재하는 재료 카테고리입니다.' },
  INGREDIENT_CATEGORY_NOT_FOUND: { code: 'E10002', message: '재료 카테고리를 찾을 수 없습니다.' },
  INGREDIENT_ALREADY_EXISTS: { code: 'E10003', message: '이미 존재하는 재료입니다.' },

  // 양념 관련 오류
  SEASONING_ALREADY_EXISTS: { code: 'E11001', message: '이미 존재하는 양념입니다.' },
  SEASONING_NOT_FOUND: { code: 'E11002', message: '양념을 찾을 수 없습니다.' },

  // 조리 도구 관련 오류
  TOOL_ALREADY_EXISTS: { code: 'E12001', message: '이미 존재하는 조리 도구입니다.' },

  // 레시피 관련 오류
  RECIPE_CREATE_FAILED: { code: 'E13001', message: '레시피 생성에 실패했습니다.' },
  RECIPE_NOT_FOUND: { code: 'E13002', message: '레시피를 찾을 수 없습니다.' },
  RECIPE_GET_FAILED: { code: 'E13003', message: '레시피 조회에 실패했습니다.' },
  RECIPE_RECOMMENDATION_CONDITION_ALREADY_EXISTS: { code: 'E13004', message: '이미 존재하는 레시피 추천 조건입니다.' },
  RECIPE_RECOMMENDATION_CONDITION_NOT_FOUND: { code: 'E13005', message: '레시피 추천 조건을 찾을 수 없습니다.' },

  // 컨디션 관련 오류
  CONDITION_ALREADY_EXISTS: { code: 'E14001', message: '이미 존재하는 컨디션입니다.' },
  CONDITION_NOT_FOUND: { code: 'E14002', message: '컨디션을 찾을 수 없습니다.' },

  // 후기 관련 오류
  REVIEW_NOT_ALLOWED: { code: 'E15001', message: '레시피 완료 후에만 후기를 작성할 수 있습니다.' },
  REVIEW_ALREADY_EXISTS: { code: 'E15002', message: '이미 해당 레시피에 대한 후기를 작성했습니다.' },
  REVIEW_COMPLETION_NOT_FOUND: { code: 'E15003', message: '완료된 레시피 기록을 찾을 수 없습니다.' },

  // 건강 설문 오류
  HEALTH_SURVEY_NOT_ELIGIBLE: { code: 'E16001', message: '현재는 건강 설문을 작성할 수 없습니다.' },

  // 계량 가이드 오류
  MEASUREMENT_GUIDE_ALREADY_EXISTS: { code: 'E17001', message: '이미 존재하는 계량 가이드입니다.' },
  MEASUREMENT_GUIDE_NOT_FOUND: { code: 'E17002', message: '계량 가이드를 찾을 수 없습니다.' },

  // 로그아웃 관련
  LOGOUT_FAILED: { code: 'E2101', message: '로그아웃 처리 중 오류가 발생했습니다.' },
  REFRESH_REVOKE_FAILED: { code: 'E2102', message: '리프레시 토큰을 무효화하지 못했습니다.' },
  ACCESS_BLACKLIST_FAILED: { code: 'E2103', message: '액세스 토큰 블랙리스트 처리에 실패했습니다.' },

  // 로그인 세션 관련
  LOGIN_SESSION_NOT_FOUND: { code: 'E2104', message: '로그인 세션을 찾을 수 없습니다. 다시 로그인해주세요.' },
  LOGIN_SESSION_EXPIRED: { code: 'E2105', message: '로그인 세션이 만료되었습니다. 다시 로그인해주세요.' },
};