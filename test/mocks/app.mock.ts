import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MockAuthModule } from './auth.mock';
import { MockDatabaseModule } from './database.mock';
import { MockUserModule } from './user.mock';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MockDatabaseModule,
    MockAuthModule,
    MockUserModule,
  ],
})
export class MockAppModule {}
