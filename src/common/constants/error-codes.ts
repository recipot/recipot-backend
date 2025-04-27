/* eslint-disable */
export const ERROR_CODES = {
  // 유저 관련 오류
  USER_NOT_FOUND: { code: 'E1001', message: '사용자를 찾을 수 없습니다.' },
  USER_ALREADY_EXISTS: { code: 'E1002', message: '이미 존재하는 사용자입니다.' },
  INVALID_USER_CREDENTIALS: { code: 'E1003', message: '잘못된 사용자 정보입니다.' },

  // 인증 및 로그인 오류
  AUTH_TOKEN_EXPIRED: { code: 'E2001', message: '인증 토큰이 만료되었습니다.' },
  AUTH_INVALID_TOKEN: { code: 'E2002', message: '유효하지 않은 토큰입니다.' },
  AUTH_ACCESS_DENIED: { code: 'E2003', message: '접근 권한이 없습니다.' },
  AUTH_INVALID_PASSWORD: { code: 'E2004', message: '잘못된 비밀번호입니다.' },

  // 데이터베이스 오류
  DATA_NOT_FOUND: { code: 'E3002', message: '요청한 데이터를 찾을 수 없습니다.' },

  // 권한 및 접근 오류
  PERMISSION_DENIED: { code: 'E4001', message: '이 작업을 수행할 권한이 없습니다.' },
  ROLE_NOT_ALLOWED: { code: 'E4002', message: '해당 역할에서는 이 작업을 수행할 수 없습니다.' },

  // 서버 오류
  INTERNAL_SERVER_ERROR: { code: 'E5000', message: '서버 내부 오류가 발생했습니다.' },
  SERVICE_UNAVAILABLE: { code: 'E5001', message: '현재 서비스를 이용할 수 없습니다.' },
  TIMEOUT_ERROR: { code: 'E5002', message: '요청 시간이 초과되었습니다.' },

  // 유효성 검사 오류
  VALIDATION_ERROR: { code: 'E6001', message: '입력값이 유효하지 않습니다.' },
  MISSING_REQUIRED_FIELDS: { code: 'E6002', message: '필수 입력값이 누락되었습니다.' },
  INVALID_FORMAT: { code: 'E6003', message: '입력값 형식이 올바르지 않습니다.' },

  // 파일 업로드 오류
  FILE_TOO_LARGE: { code: 'E7001', message: '파일 크기가 너무 큽니다.' },
  UNSUPPORTED_FILE_TYPE: { code: 'E7002', message: '지원되지 않는 파일 형식입니다.' },

  // API 요청 오류
  RATE_LIMIT_EXCEEDED: { code: 'E8001', message: '요청 제한을 초과했습니다.' },
  INVALID_API_KEY: { code: 'E8002', message: '유효하지 않은 API 키입니다.' },
};