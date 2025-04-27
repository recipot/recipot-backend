import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  public async get(key: string): Promise<any> {
    return await this.cache.get(key);
  }

  public async set(key: string, value: any, ttl?: any): Promise<void> {
    await this.cache.set(key, value, ttl);
  }

  public async del(key: string): Promise<void> {
    await this.cache.del(key);
  }
}
