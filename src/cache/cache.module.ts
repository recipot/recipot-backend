import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { redisStore } from 'cache-manager-redis-yet';

import { CacheService } from '@/cache/cache.service';
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
            username: redisConfig.options.username,
            password: redisConfig.options.password,
            ttl: redisConfig.options.ttl,
          }),
        };
      },
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
