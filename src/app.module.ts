import { HealthModule } from '@/api/health/health.module';
import { UserModule } from '@/api/user/user.module';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { CacheModule } from '@/common/cache/cache.module';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';
import { LoggerModule } from '@/common/logger/logger.module';
import { ConfigModule } from '@/config/config.module';
import { DatabaseModule } from '@/database/database.module';
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './api/auth/auth.module';
import { LoginModule } from './api/login/login.module';
import { UploadModule } from './api/upload/upload.module';
import { ResponseTimeInterceptor } from './common/interceptors/response-time.interceptor';

export const FeatureModules = [
  UserModule,
  LoginModule,
  AuthModule,
  CacheModule,
  DatabaseModule,
  LoggerModule,
  HealthModule,
  UploadModule,
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
      provide: APP_INTERCEPTOR,
      useClass: ResponseTimeInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
