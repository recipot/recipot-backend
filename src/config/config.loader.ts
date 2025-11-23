export const loadConfig = async (env: NodeJS.ProcessEnv = process.env) => {
  // 프로덕션 환경에서 BASE_DOMAIN 필수 검증
  if (env.NODE_ENV === 'production' && !env.BASE_DOMAIN) {
    throw new Error(
      'BASE_DOMAIN environment variable is required in production environment',
    );
  }

  if (
    env.BASE_DOMAIN &&
    !/^\.?([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(
      env.BASE_DOMAIN,
    )
  ) {
    throw new Error(
      'BASE_DOMAIN must be a valid domain format (e.g., example.com or .example.com)',
    );
  }

  // 카카오 OAuth 환경변수 검증 (테스트 환경 제외)
  if (
    env.NODE_ENV !== 'test' &&
    (!env.KAKAO_CLIENT_ID || !env.KAKAO_REDIRECT_URI)
  ) {
    throw new Error(
      'KAKAO_CLIENT_ID and KAKAO_REDIRECT_URI environment variables are required',
    );
  }

  // 구글 OAuth 환경변수 검증 (테스트 환경 제외)
  if (
    env.NODE_ENV !== 'test' &&
    (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_REDIRECT_URI)
  ) {
    throw new Error(
      'GOOGLE_CLIENT_ID and GOOGLE_REDIRECT_URI environment variables are required',
    );
  }

  return {
    jwt: {
      algorithm: env.JWT_ALGORITHM,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
      accessSecret: env.JWT_ACCESS_SECRET,
      accessExpire: env.JWT_ACCESS_EXPIRE
        ? Number(env.JWT_ACCESS_EXPIRE)
        : undefined,
      refreshSecret: env.JWT_REFRESH_SECRET,
      refreshExpire: env.JWT_REFRESH_EXPIRE
        ? Number(env.JWT_REFRESH_EXPIRE)
        : undefined,
    },

    redis: {
      type: env.REDIS_CONNECTION_TYPE,
      host: env.REDIS_CONNECTION_HOST,
      port: env.REDIS_CONNECTION_PORT
        ? Number(env.REDIS_CONNECTION_PORT)
        : undefined,
      url:
        env.REDIS_CONNECTION_HOST && env.REDIS_CONNECTION_PORT
          ? `redis://${env.REDIS_CONNECTION_HOST}:${env.REDIS_CONNECTION_PORT}`
          : undefined,
      options: {
        username: env.REDIS_CONNECTION_USER,
        password: env.REDIS_CONNECTION_PWD,
        ttl: env.REDIS_CONNECTION_TTL
          ? Number(env.REDIS_CONNECTION_TTL)
          : undefined,
        retryAttempts: env.REDIS_CONNECTION_RETRY_ATTEMPTS
          ? Number(env.REDIS_CONNECTION_RETRY_ATTEMPTS)
          : undefined,
        retryDelay: env.REDIS_CONNECTION_RETRY_DELAY
          ? Number(env.REDIS_CONNECTION_RETRY_DELAY)
          : undefined,
      },
    },

    db: {
      // 테스트 환경에서는 무조건 'recipot_test' 데이터베이스 사용
      type: (env.DB_TYPE ?? 'mysql') as any,
      host: env.DB_HOST,
      port: env.DB_PORT ? Number(env.DB_PORT) : 3306,
      username: env.DB_USERNAME,
      password: env.DB_PASSWORD,
      database: env.NODE_ENV === 'test' ? 'recipot_test' : env.DB_DATABASE,
    },

    frontendUrl: {
      urls: env.FRONTEND_URL,
    },

    baseDomain: env.BASE_DOMAIN,

    kakao: {
      clientId: env.KAKAO_CLIENT_ID,
      clientSecret: env.KAKAO_CLIENT_SECRET,
      redirectUri: env.KAKAO_REDIRECT_URI,
    },

    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      redirectUri: env.GOOGLE_REDIRECT_URI,
      scope: env.GOOGLE_SCOPE,
    },
  };
};
