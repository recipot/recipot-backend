import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/api/auth/auth.module';
import { Recipe } from '@/database/entity/recipe.entity';
import { User } from '@/database/entity/user.entity';
import { UserCompletedRecipe } from '@/database/entity/user-completed-recipe.entity';
import { UserRecipeReview } from '@/database/entity/user-recipe-review.entity';
import { ReviewController } from './review.controller';
import { UserRecipeReviewService } from './review.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserRecipeReview,
      User,
      Recipe,
      UserCompletedRecipe,
    ]),
    AuthModule,
  ],
  controllers: [ReviewController],
  providers: [UserRecipeReviewService],
  exports: [UserRecipeReviewService],
})
export class ReviewModule {}
