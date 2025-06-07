import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorFunction,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { CacheService } from '@/common/cache/cache.service';

@Injectable()
export class CacheHealthIndicator {
  constructor(private readonly cacheService: CacheService) {}

  check(key: string): HealthIndicatorFunction {
    return async (): Promise<HealthIndicatorResult> => {
      try {
        await this.cacheService.ping();
        return { [key]: { status: 'up' } };
      } catch (error) {
        throw new Error(`Redis health check failed: ${error.message}`);
      }
    };
  }
}
