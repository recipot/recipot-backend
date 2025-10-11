import { AuthModule } from '@/api/auth/auth.module';
import { DatabaseModule } from '@/database/database.module';
import { CommonCode } from '@/database/entity/common-code.entity';
import { Recipe } from '@/database/entity/recipe.entity';
import { UserCompletedRecipe } from '@/database/entity/user-completed-recipe.entity';
import { UserRecentRecipes } from '@/database/entity/user-recent-recipes.entity';
import { UserRecipeBookmark } from '@/database/entity/user-recipe-bookmark.entity';
import { User } from '@/database/entity/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRecentRecipesCustomRepository } from './user-recent-recipes.custom-repository';
import { UserRecipeBookmarkCustomRepository } from './user-recipe-bookmark.custom-repository';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { Ingredient } from '@/database/entity/ingredient.entity';
import { RecipeImage } from '@/database/entity/recipe-image.entity';

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
      RecipeImage,
      Ingredient,
    ]),
    AuthModule,
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserRecipeBookmarkCustomRepository,
    UserRecentRecipesCustomRepository,
  ],
  exports: [UserService, TypeOrmModule],
})
export class UserModule {}
