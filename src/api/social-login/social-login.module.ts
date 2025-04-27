import { Module } from '@nestjs/common';
import { SocialLoginCustomRepository } from './social-login.repository';

@Module({
  imports: [],
  controllers: [],
  providers: [SocialLoginCustomRepository],
  exports: [SocialLoginCustomRepository],
})
export class SocialLoginModule {}
