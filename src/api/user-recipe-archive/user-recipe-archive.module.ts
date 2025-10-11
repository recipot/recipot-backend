import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DatabaseModule } from '@/database/database.module';
import { CommonCode } from '@/database/entity/common-code.entity';
import { Recipe } from '@/database/entity/recipe.entity';
import { UserCompletedRecipe } from '@/database/entity/user-completed-recipe.entity';
import { UserRecentRecipes } from '@/database/entity/user-recent-recipes.entity';
import { UserRecipeBookmark } from '@/database/entity/user-recipe-bookmark.entity';
import { User } from '@/database/entity/user.entity';

import { UserCompletedRecipeCustomRepository } from '@/api/user/user-completed-recipe.custom-repository';
import { UserRecentRecipesCustomRepository } from '@/api/user/user-recent-recipes.custom-repository';
import { UserRecipeBookmarkCustomRepository } from '@/api/user/user-recipe-bookmark.custom-repository';
import { UserRecipeArchiveController } from './user-recipe-archive.controller';
import { UserRecipeArchiveService } from './user-recipe-archive.service';
import { UserModule } from '@/api/user/user.module';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([
      User,
      CommonCode,
      UserRecipeBookmark,
      UserRecentRecipes,
      UserCompletedRecipe,
      Recipe,
    ]),
    UserModule,
  ],
  controllers: [UserRecipeArchiveController],
  providers: [
    UserRecipeArchiveService,
    // UserService,
    UserRecipeBookmarkCustomRepository,
    UserRecentRecipesCustomRepository,
    UserCompletedRecipeCustomRepository,
  ],
  exports: [UserRecipeArchiveService],
})
export class UserRecipeArchiveModule {}
