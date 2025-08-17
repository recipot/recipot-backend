import { AuthModule } from '@/api/auth/auth.module';
import { SocialLoginModule } from '@/api/social-login/social-login.module';
import { UserModule } from '@/api/user/user.module';
import { Module } from '@nestjs/common';
import { LoginController } from './login.controller';
import { LoginService } from './login.service';

@Module({
  imports: [AuthModule, SocialLoginModule, UserModule],
  controllers: [LoginController],
  providers: [LoginService],
  exports: [LoginService],
})
export class LoginModule {}
