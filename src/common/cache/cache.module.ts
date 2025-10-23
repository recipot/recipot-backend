import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { redisStore } from 'cache-manager-redis-yet';

import { CacheLockService } from '@/common/cache/cache-lock.service';
import { CacheService } from '@/common/cache/cache.service';
import { ConfigService } from '@/config/config.service';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const redisConfig = config.get('redis');

        return {
          store: await redisStore({
            url: redisConfig.url,
            ttl: redisConfig.options.ttl,
          }),
        };
      },
    }),
  ],
  providers: [CacheService, CacheLockService],
  exports: [CacheService, CacheLockService],
})
export class CacheModule {}
