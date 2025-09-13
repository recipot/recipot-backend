import { AuthModule } from '@/api/auth/auth.module';
import { DatabaseModule } from '@/database/database.module';
import { User } from '@/database/entity/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRecipeBookmarkCustomRepository } from './user-recipe-bookmark.custom-repository';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CommonCode } from '@/database/entity/common-code.entity';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([User, CommonCode]),
    AuthModule,
  ],
  controllers: [UserController],
  providers: [UserService, UserRecipeBookmarkCustomRepository],
  exports: [UserService],
})
export class UserModule {}
