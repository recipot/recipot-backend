import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly redis: Redis;

  constructor() {
    const redisHost = process.env.REDIS_CONNECTION_HOST;
    const redisPort = Number(process.env.REDIS_CONNECTION_PORT);
    const redisUser = process.env.REDIS_CONNECTION_USER;
    const redisPassword = process.env.REDIS_CONNECTION_PWD;

    if (!redisHost || !redisPort) {
      throw new Error(
        'Redis 연결 설정이 누락되었습니다. REDIS 환경설정을 확인해주세요.',
      );
    }

    this.redis = new Redis({
      host: redisHost,
      port: redisPort,
      username: redisUser,
      password: redisPassword,
      maxRetriesPerRequest: 3,
    });
  }

  public async get(key: string): Promise<any> {
    try {
      const result = await this.redis.get(key);
      return result;
    } catch (error) {
      this.logger.error(`Redis get error for key ${key}:`, error);
      throw error;
    }
  }

  public async set(key: string, value: any, ttl?: any): Promise<void> {
    try {
      if (ttl && ttl > 0) {
        await this.redis.set(key, value, 'EX', ttl);
      } else {
        await this.redis.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Redis set error for key ${key}:`, error);
      throw error;
    }
  }

  public async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Redis del error for key ${key}:`, error);
      throw error;
    }
  }

  public async ping(): Promise<void> {
    try {
      const testKey = 'health-check';
      const testValue = 'ping';

      await this.redis.set(testKey, testValue, 'EX', 1000);
      const result = await this.redis.get(testKey);

      if (result !== testValue) {
        throw new Error(
          'Redis ping failed: stored and retrieved values do not match',
        );
      }

      await this.redis.del(testKey);
    } catch (error) {
      this.logger.error('Redis ping failed:', error);
      throw new Error(`Redis health check failed: ${error.message}`);
    }
  }

  public async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
      this.logger.log('Redis 연결 종료');
    }
  }
}
