import { CacheModule } from '@/common/cache/cache.module';
import { User } from '@/database/entity/user.entity';
import { UserUnavailableIngredient } from '@/database/entity/user-unavailable-ingredient.entity';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './auth.strategy';
import { JwtGuard } from './guards/auth.guard';

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
    TypeOrmModule.forFeature([User, UserUnavailableIngredient]),
    CacheModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtGuard],
  exports: [AuthService, JwtGuard, JwtStrategy],
})
export class AuthModule {}
