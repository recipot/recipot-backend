import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheLockService {
  private readonly logger = new Logger(CacheLockService.name);

  // 메모리 캐시용 간단한 in-memory 락 저장소
  private readonly memoryLocks = new Map<
    string,
    { token: string; expiresAt: number }
  >();

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
   * cache-manager v5는 밀리초 단위 TTL을 직접 전달합니다.
   */
  async setToCache<T>(key: string, value: T, ttlSec: number): Promise<void> {
    await this.cache.set(key, JSON.stringify(value), ttlSec * 1000); // ms 단위
  }

  /**
   * 락을 획득하려고 시도합니다.
   * @returns 락 토큰 (성공 시) 또는 null (실패 시)
   */
  async acquireLock(key: string, ttlSec = 30): Promise<string | null> {
    const lockToken = `${Date.now()}:${Math.random()}`;

    // cache-manager-redis-yet의 경우 직접 Redis 클라이언트에 접근
    const store: any = (this.cache as any).store;
    if (store?.client) {
      const result = await store.client.set(key, lockToken, {
        NX: true,
        EX: ttlSec,
      });
      return result === 'OK' ? lockToken : null;
    }

    // 메모리 캐시인 경우 간단한 in-memory 락 구현
    this.cleanupExpiredMemoryLocks();

    const existing = this.memoryLocks.get(key);
    const now = Date.now();

    if (existing && existing.expiresAt > now) {
      // 락이 이미 존재하고 만료되지 않음
      return null;
    }

    // 락 획득
    this.memoryLocks.set(key, {
      token: lockToken,
      expiresAt: now + ttlSec * 1000,
    });

    return lockToken;
  }

  /**
   * 만료된 메모리 락을 정리합니다.
   */
  private cleanupExpiredMemoryLocks(): void {
    const now = Date.now();
    for (const [key, lock] of this.memoryLocks.entries()) {
      if (lock.expiresAt <= now) {
        this.memoryLocks.delete(key);
      }
    }
  }

  /**
   * 락을 해제합니다 (소유권 검증 포함).
   * @param key 락 키
   * @param token 락 획득 시 받은 토큰
   * @returns 성공적으로 해제된 경우 true, 그렇지 않으면 false
   */
  async releaseLock(key: string, token: string): Promise<boolean> {
    const store: any = (this.cache as any).store;
    if (store?.client) {
      // Lua 스크립트를 사용하여 원자적으로 소유권 검증 후 삭제
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;

      const result = await store.client.eval(script, {
        keys: [key],
        arguments: [token],
      });

      return result === 1;
    }

    // 메모리 캐시인 경우 소유권 검증
    const existing = this.memoryLocks.get(key);
    if (existing && existing.token === token) {
      this.memoryLocks.delete(key);
      return true;
    }

    return false;
  }

  /**
   * 캐시 키 패턴으로 삭제합니다 (SCAN 사용하여 블로킹 방지).
   */
  async deleteByPattern(pattern: string): Promise<void> {
    const store: any = (this.cache as any).store;
    if (store?.client) {
      let cursor = '0';
      let totalDeleted = 0;

      do {
        // SCAN을 사용하여 안전하게 패턴 매칭
        const result: any = await store.client.scan(cursor, {
          MATCH: pattern,
          COUNT: 100,
        });

        cursor = String(result?.cursor ?? result?.[0] ?? '0');
        const keys: string[] = result?.keys ?? result?.[1] ?? [];

        if (keys.length > 0) {
          await store.client.del(...keys);
          totalDeleted += keys.length;
        }
      } while (cursor !== '0');

      if (totalDeleted > 0) {
        this.logger.debug(`패턴 ${pattern}으로 ${totalDeleted}개 키 삭제`);
      }
    }
  }

  /**
   * 캐시 키 패턴으로 키를 스캔하여 반환합니다.
   */
  async scanKeys(pattern: string): Promise<string[]> {
    const store: any = (this.cache as any).store;
    const keys: string[] = [];

    if (store?.client) {
      let cursor = '0';

      do {
        // SCAN을 사용하여 안전하게 패턴 매칭
        const result: any = await store.client.scan(cursor, {
          MATCH: pattern,
          COUNT: 100,
        });

        cursor = String(result?.cursor ?? result?.[0] ?? '0');
        const scannedKeys: string[] = result?.keys ?? result?.[1] ?? [];

        if (scannedKeys.length > 0) {
          keys.push(...scannedKeys);
        }
      } while (cursor !== '0');
    }

    return keys;
  }

  /**
   * 특정 키들을 삭제합니다.
   */
  async deleteKeys(keys: string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }

    const store: any = (this.cache as any).store;
    if (store?.client) {
      await store.client.del(...keys);
      this.logger.debug(`${keys.length}개 캐시 키 삭제`);
    }
  }
}
