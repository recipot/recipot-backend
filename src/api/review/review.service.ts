import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { ERROR_CODES } from '@/common/constants/error-codes';
import { CustomException } from '@/common/exceptions/custom-exception';
import { CommonCode } from '@/database/entity/common-code.entity';
import { RecipeImage } from '@/database/entity/recipe-image.entity';
import { Recipe } from '@/database/entity/recipe.entity';
import { UserCompletedRecipe } from '@/database/entity/user-completed-recipe.entity';
import { UserRecipeReview } from '@/database/entity/user-recipe-review.entity';
import { User } from '@/database/entity/user.entity';
import { CreateUserRecipeReviewDto } from './dto/create-user-recipe-review.dto';
import {
  GetUserRecipeReviewPreparationQueryDto,
  GetUserRecipeReviewPreparationResponseDto,
  ReviewCodeOptionDto,
} from './dto/get-user-recipe-review-preparation.dto';

const TASTE_CODE_GROUP = 'R03';
const DIFFICULTY_CODE_GROUP = 'R04';
const EXPERIENCE_CODE_GROUP = 'R05';

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
    @InjectRepository(RecipeImage)
    private readonly recipeImageRepository: Repository<RecipeImage>,
    @InjectRepository(CommonCode)
    private readonly commonCodeRepository: Repository<CommonCode>,
  ) {}

  async createReview(
    userId: number,
    dto: CreateUserRecipeReviewDto,
  ): Promise<UserRecipeReview> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new CustomException(
        ERROR_CODES.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const completedRecipe = await this.userCompletedRecipeRepository.findOne({
      where: {
        id: dto.completedRecipeId,
        userId,
      },
    });
    if (!completedRecipe || !completedRecipe.isCompleted) {
      throw new CustomException(
        ERROR_CODES.REVIEW_NOT_ALLOWED,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 후기 중복 체크 제거, 한 사용자가 여러 번 후기를 등록할 수 있도록 수정
    // if (completedRecipe.isReviewed) {
    //   throw new CustomException(
    //     ERROR_CODES.REVIEW_ALREADY_EXISTS,
    //     HttpStatus.CONFLICT,
    //   );
    // }

    // const alreadyReviewed = await this.userRecipeReviewRepository.exists({
    //   where: {
    //     userCompletedRecipeId: completedRecipe.id,
    //   },
    // });
    // if (alreadyReviewed) {
    //   throw new CustomException(
    //     ERROR_CODES.REVIEW_ALREADY_EXISTS,
    //     HttpStatus.CONFLICT,
    //   );
    // }

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

  async getUserRecipeReviewPreparation(
    userId: number,
    query: GetUserRecipeReviewPreparationQueryDto,
  ): Promise<GetUserRecipeReviewPreparationResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new CustomException(ERROR_CODES.USER_NOT_FOUND);
    }

    const completedRecipe = await this.userCompletedRecipeRepository.findOne({
      where: {
        id: query.completedRecipeId,
        userId,
        isCompleted: true,
      },
    });

    if (!completedRecipe) {
      throw new CustomException(ERROR_CODES.REVIEW_COMPLETION_NOT_FOUND);
    }

    const recipe = await this.recipeRepository.findOne({
      where: { id: completedRecipe.recipeId },
    });

    if (!recipe) {
      throw new CustomException(
        ERROR_CODES.RECIPE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const completionCount = await this.userCompletedRecipeRepository.count({
      where: {
        userId,
        recipeId: recipe.id,
        isCompleted: true,
      },
    });

    const representativeImage = await this.recipeImageRepository.findOne({
      where: { recipeId: recipe.id },
      order: { id: 'ASC' },
    });

    const codeGroups = [
      TASTE_CODE_GROUP,
      DIFFICULTY_CODE_GROUP,
      EXPERIENCE_CODE_GROUP,
    ];

    const commonCodes = await this.commonCodeRepository.find({
      where: {
        groupCode: In(codeGroups),
        isActive: true,
      },
      order: {
        groupCode: 'ASC',
        orderNum: 'ASC',
        code: 'ASC',
      },
    });

    const tasteOptions = this.filterCodeOptions(commonCodes, TASTE_CODE_GROUP);
    const difficultyOptions = this.filterCodeOptions(
      commonCodes,
      DIFFICULTY_CODE_GROUP,
    );
    const experienceOptions = this.filterCodeOptions(
      commonCodes,
      EXPERIENCE_CODE_GROUP,
    );

    return {
      completionCount,
      completionMessage: `${completionCount}번째 해먹기 완료!`,
      recipeName: recipe.title,
      recipeImageUrl: representativeImage?.imageUrl ?? null,
      tasteOptions,
      difficultyOptions,
      experienceOptions,
    };
  }

  private filterCodeOptions(
    codes: CommonCode[],
    groupCode: string,
  ): ReviewCodeOptionDto[] {
    return codes
      .filter((code) => code.groupCode === groupCode)
      .map((code) => ({
        code: code.code,
        codeName: code.codeName,
      }));
  }
}
