import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/api/auth/auth.module';
import { Recipe } from '@/database/entity/recipe.entity';
import { RecipeImage } from '@/database/entity/recipe-image.entity';
import { User } from '@/database/entity/user.entity';
import { UserCompletedRecipe } from '@/database/entity/user-completed-recipe.entity';
import { UserRecipeReview } from '@/database/entity/user-recipe-review.entity';
import { CommonCode } from '@/database/entity/common-code.entity';
import { ReviewController } from './review.controller';
import { UserRecipeReviewService } from './review.service';
import { CommonCodeModule } from '../common-code/common-code.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserRecipeReview,
      User,
      Recipe,
      RecipeImage,
      UserCompletedRecipe,
      CommonCode,
    ]),
    AuthModule,
    CommonCodeModule,
  ],
  controllers: [ReviewController],
  providers: [UserRecipeReviewService],
  exports: [UserRecipeReviewService],
})
export class ReviewModule {}
