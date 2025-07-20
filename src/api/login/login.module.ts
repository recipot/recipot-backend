import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoginEntity } from '@/database/entity/login.entity';
import { LoginCustomRepository } from './login.repository';

@Module({
  imports: [TypeOrmModule.forFeature([LoginEntity])],
  controllers: [],
  providers: [LoginCustomRepository],
  exports: [LoginCustomRepository],
})
export class LoginModule {}
