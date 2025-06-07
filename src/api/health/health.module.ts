import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { CacheHealthIndicator } from './indicators/cache-health.indicator';
import { CacheModule } from '@/common/cache/cache.module';

@Module({
  imports: [TerminusModule, CacheModule],
  controllers: [HealthController],
  providers: [CacheHealthIndicator],
})
export class HealthModule {}
