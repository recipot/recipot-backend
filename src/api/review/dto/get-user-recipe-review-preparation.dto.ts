import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

export class GetUserRecipeReviewPreparationQueryDto {
  @ApiProperty({ description: '유저 완료 레시피 ID', example: 42 })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  completedRecipeId: number;
}

export class ReviewCodeOptionDto {
  @ApiProperty({ description: '코드 값', example: 'R03001' })
  code: string;

  @ApiProperty({ description: '코드명', example: '평소보다 더 상쾌했어요' })
  codeName: string;
}

export class GetUserRecipeReviewPreparationResponseDto {
  @ApiProperty({ description: '현재까지 해당 레시피 완료 횟수', example: 3 })
  completionCount: number;

  @ApiProperty({ description: '횟수 안내 문구', example: '3번째 해먹기 완료!' })
  completionMessage: string;

  @ApiProperty({
    description: '해당 완료 레시피에 작성한 후기 횟수',
    example: 2,
  })
  reviewCount: number;

  @ApiProperty({ description: '레시피 이름', example: '새우 땅콩버터 버거' })
  recipeName: string;

  @ApiProperty({
    description: '대표 이미지 URL (없으면 null)',
    example: 'https://cdn.recipes/1.jpg',
    nullable: true,
  })
  recipeImageUrl: string | null;

  @ApiProperty({
    description: '맛 평가 코드 옵션',
    type: [ReviewCodeOptionDto],
  })
  tasteOptions: ReviewCodeOptionDto[];

  @ApiProperty({
    description: '요리 시작 난이도 코드 옵션',
    type: [ReviewCodeOptionDto],
  })
  difficultyOptions: ReviewCodeOptionDto[];

  @ApiProperty({
    description: '요리 경험 코드 옵션',
    type: [ReviewCodeOptionDto],
  })
  experienceOptions: ReviewCodeOptionDto[];
}
