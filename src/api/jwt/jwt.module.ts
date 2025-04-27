import { Module } from '@nestjs/common';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { JwtAuthService } from './jwt.service';

import { ConfigService } from '@/config/config.service';
import { JwtGuard } from './jwt.guard';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    NestJwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: () => ({}),
    }),
  ],
  providers: [JwtAuthService, JwtGuard, JwtStrategy],
  exports: [JwtAuthService, JwtGuard, JwtStrategy],
})
export class JwtModule {}
