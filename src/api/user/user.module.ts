import { AuthModule } from '@/api/auth/auth.module';
import { DatabaseModule } from '@/database/database.module';
import { CommonCode } from '@/database/entity/common-code.entity';
import { Recipe } from '@/database/entity/recipe.entity';
import { UserRecipeBookmark } from '@/database/entity/user-recipe-bookmark.entity';
import { User } from '@/database/entity/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRecipeBookmarkCustomRepository } from './user-recipe-bookmark.custom-repository';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([User, CommonCode, UserRecipeBookmark, Recipe]),
    AuthModule,
  ],
  controllers: [UserController],
  providers: [UserService, UserRecipeBookmarkCustomRepository],
  exports: [UserService],
})
export class UserModule {}
