import { SocialLogin } from '@/database/entity/social-login.entity';
import { User } from '@/database/entity/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialLoginService } from './social-login.service';

@Module({
  imports: [TypeOrmModule.forFeature([SocialLogin, User])],
  providers: [SocialLoginService],
  exports: [SocialLoginService],
})
export class SocialLoginModule {}
