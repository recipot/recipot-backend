export const CONSTANTS = {
  ACCESS_TOKEN_EXPIRE: 24 * 60 * 60, // 24시간 (초 단위)
  REFRESH_TOKEN_EXPIRE: 30 * 24 * 60 * 60, // 30일 (초 단위)
  ACCESS_TOKEN_PREFIX: 'access_token',
  REFRESH_TOKEN_PREFIX: 'refresh_token',
} as const;
