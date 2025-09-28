import {
  Body,
  Controller,
  Post,
  Request,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtGuard } from '@/api/auth/guards/auth.guard';
import { ERROR_CODES } from '@/common/constants/error-codes';
import { ApiErrorResponse } from '@/common/decorators/api-error-response.decorator';
import { ApiSuccessResponse } from '@/common/decorators/api-success-response.decorator';
import { UserRecipeReview } from '@/database/entity/user-recipe-review.entity';
import { CreateUserRecipeReviewDto } from './dto/create-user-recipe-review.dto';
import { UserRecipeReviewService } from './review.service';

@ApiTags('Review')
@Controller({ path: 'reviews', version: '1' })
@UseGuards(JwtGuard)
@ApiBearerAuth('Authorization')
export class ReviewController {
  constructor(private readonly reviewService: UserRecipeReviewService) {}

  @Post()
  @ApiOperation({
    summary: '레시피 후기 작성',
    description: '인증된 사용자가 레시피 후기를 등록합니다.',
  })
  @ApiSuccessResponse('레시피 후기 작성 성공', {
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      userId: { type: 'number', example: 7 },
      recipeId: { type: 'number', example: 15 },
      tasteCode: { type: 'string', example: 'R03003' },
      difficultyCode: { type: 'string', example: 'R04002' },
      experienceCode: { type: 'string', example: 'R05001' },
      content: { type: 'string', example: '이번에도 성공했어요!' },
      createdAt: { type: 'string', example: '2025-09-28T12:34:56.000Z' },
      updatedAt: { type: 'string', example: '2025-09-28T12:34:56.000Z' },
    },
  })
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, ERROR_CODES.AUTH_REQUIRED)
  @ApiErrorResponse(HttpStatus.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND)
  @ApiErrorResponse(HttpStatus.NOT_FOUND, ERROR_CODES.RECIPE_NOT_FOUND)
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, ERROR_CODES.REVIEW_NOT_ALLOWED)
  @ApiErrorResponse(HttpStatus.CONFLICT, ERROR_CODES.REVIEW_ALREADY_EXISTS)
  async createReview(
    @Request() req: any,
    @Body() createDto: CreateUserRecipeReviewDto,
  ): Promise<UserRecipeReview> {
    return await this.reviewService.createReview(req.user.sub, createDto);
  }
}
