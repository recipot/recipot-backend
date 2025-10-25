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
      type: env.DB_TYPE ?? 'mysql',
      host: env.DB_HOST,
      port: env.DB_PORT ? Number(env.DB_PORT) : 3306,
      username: env.DB_USERNAME,
      password: env.DB_PASSWORD,
      database: env.DB_DATABASE,
    },

    frontendUrl: {
      urls: env.FRONTEND_URL,
    },

    baseDomain: env.BASE_DOMAIN,
  };
};
