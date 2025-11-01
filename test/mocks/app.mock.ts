import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MockAuthModule } from './auth.mock';
import { MockDatabaseModule } from './database.mock';
import { MockRecipeModule } from './recipe.mock';
import { MockReviewModule } from './review.mock';
import { MockUserModule } from './user.mock';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MockDatabaseModule,
    MockAuthModule,
    MockRecipeModule,
    MockUserModule,
    MockReviewModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class MockAppModule {}
