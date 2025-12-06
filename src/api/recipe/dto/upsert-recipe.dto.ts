import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class UpsertRecipeToolDto {
  @ApiProperty({
    description: '조리도구 ID',
    example: 1,
    type: 'number',
  })
  @IsInt()
  @IsNotEmpty()
  toolId: number;
}

export class UpsertRecipeIngredientDto {
  @ApiProperty({
    description: '재료 ID',
    example: 1,
    type: 'number',
  })
  @IsInt()
  @IsNotEmpty()
  ingredientId: number;

  @ApiProperty({
    description: '필요량',
    example: '80g',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  amount: string;

  @ApiProperty({
    description: '대체 가능 여부',
    example: false,
    type: 'boolean',
  })
  @IsBoolean()
  isAlternative: boolean;
}

export class UpsertRecipeSeasoningDto {
  @ApiProperty({
    description: '양념 ID',
    example: 1,
    type: 'number',
  })
  @IsInt()
  @IsNotEmpty()
  seasoningId: number;

  @ApiProperty({
    description: '필요량',
    example: '2큰술',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  amount: string;
}

export class UpsertRecipeStepDto {
  @ApiProperty({
    description: '단계 순서',
    example: 1,
    type: 'number',
  })
  @IsInt()
  @IsNotEmpty()
  orderNum: number;

  @ApiProperty({
    description: '단계 요약',
    example: '컬리플라워를 잘게 다져주세요.',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  summary: string | null;

  @ApiProperty({
    description: '조리 단계 본문',
    example: '땅콩버터 한 숟갈을 떠서 식빵에 바른다.',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  content: string | null;

  @ApiProperty({
    description: '요리 예시 이미지 주소',
    example: 'https://example.com/step1.jpg',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  imageUrl: string | null;
}

export class UpsertRecipeDto {
  @ApiProperty({
    description: '레시피 ID (수정 시 필수, 생성 시 생략)',
    example: 1,
    type: 'number',
    required: false,
  })
  @IsInt()
  @IsOptional()
  id?: number;

  @ApiProperty({
    description: '레시피 타이틀',
    example: '컬리플라워 부채살 샐러드랩',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: '레시피 이미지 (첫 번째 이미지 URL)',
    example: 'https://example.com/recipe.jpg',
    nullable: true,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  imageUrl: string | null;

  @ApiProperty({
    description: '조리 시간 (분)',
    example: 15,
    type: 'number',
  })
  @IsNumber()
  @IsNotEmpty()
  duration: number;

  @ApiProperty({
    description: '유저 컨디션 ID',
    example: 1,
    nullable: true,
    type: 'number',
  })
  @IsInt()
  @IsOptional()
  conditionId?: number | null;

  @ApiProperty({
    description: '한줄 카피',
    example: '빵 위에 땅콩버터와 바나나만 얹으면 끝!',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: '조리도구 목록',
    type: [UpsertRecipeToolDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertRecipeToolDto)
  @IsOptional()
  tools?: UpsertRecipeToolDto[];

  @ApiProperty({
    description: '재료 목록',
    type: [UpsertRecipeIngredientDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertRecipeIngredientDto)
  @IsOptional()
  ingredients?: UpsertRecipeIngredientDto[];

  @ApiProperty({
    description: '양념 목록',
    type: [UpsertRecipeSeasoningDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertRecipeSeasoningDto)
  @IsOptional()
  seasonings?: UpsertRecipeSeasoningDto[];

  @ApiProperty({
    description: '조리 단계 목록',
    type: [UpsertRecipeStepDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertRecipeStepDto)
  @IsOptional()
  steps?: UpsertRecipeStepDto[];
}

export class UpsertRecipesResponseDto {
  @ApiProperty({
    description: '생성된 레시피 수',
    example: 3,
    type: 'number',
  })
  createdCount: number;

  @ApiProperty({
    description: '수정된 레시피 수',
    example: 2,
    type: 'number',
  })
  updatedCount: number;
}
