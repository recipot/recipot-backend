export const GOOGLE_API = {
  AUTH_HOST: 'https://accounts.google.com',
  TOKEN_HOST: 'https://oauth2.googleapis.com',
  API_HOST: 'https://www.googleapis.com',

  AUTH_URI: '/o/oauth2/v2/auth',
  TOKEN_URI: '/token',
  USERINFO_URI: '/oauth2/v3/userinfo',

  RESPONSE_TYPE: 'code',

  DEFAULTS: {
    SCOPE: 'openid email profile',
    ACCESS_TYPE: 'online',
    INCLUDE_GRANTED_SCOPES: 'true',
    PROMPT: 'consent',
  },

  ENV_KEYS: {
    CLIENT_ID: 'GOOGLE_CLIENT_ID',
    CLIENT_SECRET: 'GOOGLE_CLIENT_SECRET',
    REDIRECT_URI: 'GOOGLE_REDIRECT_URI',
    SCOPE: 'GOOGLE_SCOPE',
  },
} as const;

export const GOOGLE_API_URLS = {
  AUTH_URL: `${GOOGLE_API.AUTH_HOST}${GOOGLE_API.AUTH_URI}`,
  TOKEN_URL: `${GOOGLE_API.TOKEN_HOST}${GOOGLE_API.TOKEN_URI}`,
  USERINFO_URL: `${GOOGLE_API.API_HOST}${GOOGLE_API.USERINFO_URI}`,
} as const;
