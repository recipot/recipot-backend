import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheLockService {
  private readonly logger = new Logger(CacheLockService.name);

  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  /**
   * 캐시에서 데이터를 가져옵니다.
   */
  async getFromCache<T>(key: string): Promise<T | null> {
    const value = await this.cache.get<string>(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  /**
   * 캐시에 데이터를 저장합니다.
   */
  async setToCache<T>(key: string, value: T, ttlSec: number): Promise<void> {
    await this.cache.set(key, JSON.stringify(value), ttlSec * 1000); // ms 단위
  }

  /**
   * 락을 획득하려고 시도합니다.
   */
  async tryAcquireLock(key: string, ttlSec = 8): Promise<boolean> {
    const lockVal = `${Date.now()}:${Math.random()}`;

    // cache-manager-redis-yet의 경우 직접 Redis 클라이언트에 접근
    const store: any = (this.cache as any).store;
    if (store?.client) {
      const result = await store.client.set(key, lockVal, {
        NX: true,
        EX: ttlSec,
      });
      return result === 'OK';
    }

    // 메모리 캐시인 경우 락 생략
    return true;
  }

  /**
   * 락을 해제합니다.
   */
  async releaseLock(key: string): Promise<void> {
    const store: any = (this.cache as any).store;
    if (store?.client) {
      await store.client.del(key);
    }
  }

  /**
   * 캐시 키 패턴으로 삭제합니다.
   */
  async deleteByPattern(pattern: string): Promise<void> {
    const store: any = (this.cache as any).store;
    if (store?.client) {
      const keys = await store.client.keys(pattern);
      if (keys.length > 0) {
        await store.client.del(...keys);
      }
    }
  }
}
