import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { ConfigModule } from '@/config/config.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';
import { UserModule } from '@/api/user/user.module';
import { BoardModule } from '@/api/board/board.module';
import { CacheModule } from '@/common/cache/cache.module';
import { DatabaseModule } from '@/database/database.module';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { LoggerModule } from '@/common/logger/logger.module';
import { SocialLoginModule } from './api/social-login/social-login.module';
import { LoginModule } from './api/login/login.module';
import { HealthModule } from '@/api/health/health.module';

export const FeatureModules = [
  UserModule,
  LoginModule,
  SocialLoginModule,
  BoardModule,
  CacheModule,
  DatabaseModule,
  LoggerModule,
  HealthModule,
];

@Module({
  imports: [ConfigModule.forRootAsync({ isGlobal: true }), ...FeatureModules],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
