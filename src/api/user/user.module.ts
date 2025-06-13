import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '@/database/database.module';
import { JwtModule } from '@/api/jwt/jwt.module';
import { UserEntity } from '@/database/entity/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserCustomRepository } from './user-custom.repository';
import { LoginModule } from '../login/login.module';
import { SocialLoginModule } from '../social-login/social-login.module';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([UserEntity]),
    JwtModule,
    LoginModule,
    SocialLoginModule,
  ],
  controllers: [UserController],
  providers: [UserService, UserCustomRepository],
})
export class UserModule {}
