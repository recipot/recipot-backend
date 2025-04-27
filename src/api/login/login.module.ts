import { Module } from '@nestjs/common';
import { LoginCustomRepository } from './login.repository';

@Module({
  imports: [],
  controllers: [],
  providers: [LoginCustomRepository],
  exports: [LoginCustomRepository],
})
export class LoginModule {}
