export const loadConfig = async (env: NodeJS.ProcessEnv = process.env) => {
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
  };
};
