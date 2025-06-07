import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { CacheHealthIndicator } from './indicators/cache-health.indicator';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private cache: CacheHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    const result = await this.health.check([
      () => this.db.pingCheck('database'),
      this.cache.check('redis'),
      () => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 512 * 1024 * 1024),
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.9,
        }),
    ]);

    const { details, info, ...response } = result;

    // info와 details가 같으면 details를 제외하고 반환
    if (JSON.stringify(info) === JSON.stringify(details)) {
      return { ...response, info };
    }

    return { ...response, info, details };
  }
}
