import { CacheModule } from '@/common/cache/cache.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { JwtGuard } from './guards/auth.guard';
import { AuthService } from './auth.service';
import { JwtStrategy } from './auth.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async () => ({
        secret: process.env.JWT_ACCESS_SECRET,
        signOptions: {
          expiresIn: process.env.JWT_ACCESS_EXPIRE,
          algorithm: process.env.JWT_ALGORITHM as any,
        },
      }),
      inject: [],
    }),
    CacheModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtGuard],
  exports: [AuthService, JwtGuard, JwtStrategy],
})
export class AuthModule {}
