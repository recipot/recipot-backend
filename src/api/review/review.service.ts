import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRecipeReview } from '@/database/entity/user-recipe-review.entity';
import { User } from '@/database/entity/user.entity';
import { Recipe } from '@/database/entity/recipe.entity';
import { UserCompletedRecipe } from '@/database/entity/user-completed-recipe.entity';
import { CustomException } from '@/common/exceptions/custom-exception';
import { ERROR_CODES } from '@/common/constants/error-codes';
import { CreateUserRecipeReviewDto } from './dto/create-user-recipe-review.dto';

@Injectable()
export class UserRecipeReviewService {
  constructor(
    @InjectRepository(UserRecipeReview)
    private readonly userRecipeReviewRepository: Repository<UserRecipeReview>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Recipe)
    private readonly recipeRepository: Repository<Recipe>,
    @InjectRepository(UserCompletedRecipe)
    private readonly userCompletedRecipeRepository: Repository<UserCompletedRecipe>,
  ) {}

  async createReview(
    userId: number,
    dto: CreateUserRecipeReviewDto,
  ): Promise<UserRecipeReview> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new CustomException(ERROR_CODES.USER_NOT_FOUND);
    }

    const completedRecipe = await this.userCompletedRecipeRepository.findOne({
      where: {
        id: dto.completedRecipeId,
        userId,
      },
    });
    if (!completedRecipe || !completedRecipe.isCompleted) {
      throw new CustomException(ERROR_CODES.REVIEW_NOT_ALLOWED);
    }

    if (completedRecipe.isReviewed) {
      throw new CustomException(ERROR_CODES.REVIEW_ALREADY_EXISTS);
    }

    const alreadyReviewed = await this.userRecipeReviewRepository.exists({
      where: {
        userCompletedRecipeId: completedRecipe.id,
      },
    });
    if (alreadyReviewed) {
      throw new CustomException(ERROR_CODES.REVIEW_ALREADY_EXISTS);
    }

    const review = this.userRecipeReviewRepository.create({
      userId,
      userCompletedRecipeId: completedRecipe.id,
      tasteCode: dto.tasteCode ?? null,
      difficultyCode: dto.difficultyCode ?? null,
      experienceCode: dto.experienceCode ?? null,
      content: dto.content ?? null,
    });

    const savedReview = await this.userRecipeReviewRepository.save(review);

    await this.userCompletedRecipeRepository.update(completedRecipe.id, {
      isReviewed: true,
    });

    return savedReview;
  }
}
