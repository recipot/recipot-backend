/* eslint-disable */
export const ERROR_CODES = {
  // 유저 관련 오류
  USER_NOT_FOUND: { code: 'E1001', message: '사용자를 찾을 수 없습니다.' },

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

  // 공통 오류
  COMMON_CODE_ALREADY_EXISTS: { code: 'E3001', message: '이미 존재하는 공통 코드입니다.' },

  // 서버 오류
  INTERNAL_SERVER_ERROR: { code: 'E5000', message: '서버 내부 오류가 발생했습니다.' },

  // 유효성 검사 오류
  VALIDATION_ERROR: { code: 'E6001', message: '입력값이 유효하지 않습니다.' },
  INVALID_FORMAT: { code: 'E6003', message: '입력값 형식이 올바르지 않습니다.' },

  // 파일 업로드 오류
  FILE_UPLOAD_FAILED: { code: 'E7003', message: '파일 업로드 중 오류가 발생했습니다.' },

  // 소셜 로그인 오류
  KAKAO_USER_INFO_FAILED: { code: 'E9003', message: '카카오 사용자 정보 조회에 실패했습니다.' },
  INVALID_KAKAO_CODE: { code: 'E9006', message: '유효하지 않은 카카오 인가 코드입니다.' },
  KAKAO_SERVICE_UNAVAILABLE: { code: 'E9007', message: '카카오 서비스를 이용할 수 없습니다.' },
  KAKAO_LOGIN_PROCESS_ERROR: { code: 'E9008', message: '카카오 로그인 처리 중 오류가 발생했습니다.' },
  KAKAO_CONFIG_ERROR: { code: 'E9009', message: '카카오 설정이 올바르지 않습니다. 환경변수를 확인해주세요.' },
};