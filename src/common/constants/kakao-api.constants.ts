/**
 * 카카오 API 관련 상수
 */

export const KAKAO_API = {
  // API 호스트
  AUTH_HOST: 'https://kauth.kakao.com',
  API_HOST: 'https://kapi.kakao.com',

  // 인증 관련 엔드포인트
  AUTH_URI: '/oauth/authorize',
  TOKEN_URI: '/oauth/token',

  // 사용자 관련 엔드포인트
  USER_ME: '/v2/user/me',
  USER_LOGOUT: '/v1/user/logout',
  USER_UNLINK: '/v1/user/unlink',

  // OAuth 설정
  RESPONSE_TYPE: 'code',
  SCOPE: 'account_email',

  // 환경변수 키
  ENV_KEYS: {
    CLIENT_ID: 'KAKAO_CLIENT_ID',
    CLIENT_SECRET: 'KAKAO_CLIENT_SECRET',
    REDIRECT_URI: 'KAKAO_REDIRECT_URI',
  },
} as const;

export const KAKAO_API_URLS = {
  // 전체 URL
  AUTH_URL: `${KAKAO_API.AUTH_HOST}${KAKAO_API.AUTH_URI}`,
  TOKEN_URL: `${KAKAO_API.AUTH_HOST}${KAKAO_API.TOKEN_URI}`,
  USER_ME_URL: `${KAKAO_API.API_HOST}${KAKAO_API.USER_ME}`,
  USER_LOGOUT_URL: `${KAKAO_API.API_HOST}${KAKAO_API.USER_LOGOUT}`,
  USER_UNLINK_URL: `${KAKAO_API.API_HOST}${KAKAO_API.USER_UNLINK}`,
} as const;
