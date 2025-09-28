import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateUserRecipeReviewDto {
  @ApiProperty({ description: '완료된 레시피 기록 ID', example: 42 })
  @IsInt()
  @IsNotEmpty()
  completedRecipeId: number;

  @ApiProperty({
    description: '맛 평가 코드',
    example: 'R03003',
    required: false,
  })
  @IsString()
  @MaxLength(6)
  @IsOptional()
  tasteCode?: string;

  @ApiProperty({
    description: '요리 시작 난이도 코드',
    example: 'R04002',
    required: false,
  })
  @IsString()
  @MaxLength(6)
  @IsOptional()
  difficultyCode?: string;

  @ApiProperty({
    description: '요리 경험 코드',
    example: 'R05002',
    required: false,
  })
  @IsString()
  @MaxLength(6)
  @IsOptional()
  experienceCode?: string;

  @ApiProperty({
    description: '리뷰 내용',
    example: '이번엔 맛 조절이 쉬웠어요!',
    required: false,
  })
  @IsString()
  @IsOptional()
  content?: string;
}
