import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { redisStore } from 'cache-manager-redis-yet';

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
  providers: [CacheService],
  exports: [CacheService, NestCacheModule], // CACHE_MANAGER 토큰도 함께 export
})
export class CacheModule {}
