import { JwtModule } from '@/api/jwt/jwt.module';
import { SocialLoginModule } from '@/api/social-login/social-login.module';
import { UserModule } from '@/api/user/user.module';
import { Module } from '@nestjs/common';
import { LoginController } from './login.controller';
import { LoginService } from './login.service';

@Module({
  imports: [JwtModule, SocialLoginModule, UserModule],
  controllers: [LoginController],
  providers: [LoginService],
  exports: [LoginService],
})
export class LoginModule {}
