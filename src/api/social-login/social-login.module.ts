import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialLoginEntity } from '@/database/entity/social-login.entity';
import { SocialLoginCustomRepository } from './social-login.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SocialLoginEntity])],
  controllers: [],
  providers: [SocialLoginCustomRepository],
  exports: [SocialLoginCustomRepository],
})
export class SocialLoginModule {}
