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
  IsUrl,
  ValidateNested,
} from 'class-validator';

export class CreateRecipeIngredientDto {
  @ApiProperty({
    description: '재료 ID',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  ingredientId: number;

  @ApiProperty({
    description: '대체 가능 여부',
    example: false,
  })
  @IsBoolean()
  isAlternative: boolean;

  @ApiProperty({
    description: '개수 또는 양',
    example: '200g',
  })
  @IsString()
  @IsNotEmpty()
  amount: string;
}

export class CreateRecipeSeasoningDto {
  @ApiProperty({
    description: '양념 ID',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  seasoningId: number;

  @ApiProperty({
    description: '필요량',
    example: '1큰술',
  })
  @IsString()
  @IsNotEmpty()
  amount: string;
}

export class CreateRecipeToolDto {
  @ApiProperty({
    description: '조리도구 ID',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  toolId: number;
}

export class CreateRecipeStepDto {
  @ApiProperty({
    description: '순서',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  orderNum: number;

  @ApiProperty({
    description: '요리 예시 이미지 주소',
    example: 'https://example.com/step1.jpg',
  })
  @IsString()
  @IsUrl()
  @IsNotEmpty()
  imageUrl: string;

  @ApiProperty({
    description: '요약',
    example: '재료를 준비합니다',
  })
  @IsString()
  @IsNotEmpty()
  summary: string;

  @ApiProperty({
    description: '상세 내용',
    example: '고등어를 깨끗이 씻어서 3등분으로 자릅니다.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class CreateRecipeHealthPointDto {
  @ApiProperty({
    description: '한줄 건강 포인트',
    example: '고등어의 오메가3가 심혈관 건강에 도움을 줍니다',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class CreateRecipeImageDto {
  @ApiProperty({
    description: '레시피 이미지 주소',
    example: 'https://example.com/recipe.jpg',
  })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;
}

export class CreateRecipeConditionWeightDto {
  @ApiProperty({
    description: '컨디션 ID',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  conditionId: number;

  @ApiProperty({
    description: '가중치 (높을수록 더 적합)',
    example: 1.5,
  })
  @IsNumber()
  @IsNotEmpty()
  priorityScore: number;
}

export class CreateRecipeDto {
  @ApiProperty({
    description: '레시피 제목',
    example: '간장 고등어 구이',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: '레시피 설명',
    example: '고소하고 짭짤한 간장 고등어 구이입니다. 밥반찬으로 최고!',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: '소요 시간 (공통코드)',
    example: 'R01004',
  })
  @IsString()
  @IsNotEmpty()
  duration: string;

  @ApiProperty({
    description: '조리 난이도 (공통코드)',
    example: 'R01001',
  })
  @IsString()
  @IsNotEmpty()
  level: string;

  @ApiProperty({
    description: '조리 방식 (공통코드)',
    example: 'R02001',
  })
  @IsString()
  @IsNotEmpty()
  method: string;

  @ApiProperty({
    description: '컨디션 ID',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  conditionId: number;

  @ApiProperty({
    description: '레시피 이미지들',
    type: [CreateRecipeImageDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeImageDto)
  @IsOptional()
  images?: CreateRecipeImageDto[];

  @ApiProperty({
    description: '레시피 재료들',
    type: [CreateRecipeIngredientDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeIngredientDto)
  ingredients: CreateRecipeIngredientDto[];

  @ApiProperty({
    description: '레시피 양념들',
    type: [CreateRecipeSeasoningDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeSeasoningDto)
  @IsOptional()
  seasonings?: CreateRecipeSeasoningDto[];

  @ApiProperty({
    description: '레시피 조리도구들',
    type: [CreateRecipeToolDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeToolDto)
  @IsOptional()
  tools?: CreateRecipeToolDto[];

  @ApiProperty({
    description: '레시피 요리 순서들',
    type: [CreateRecipeStepDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeStepDto)
  steps: CreateRecipeStepDto[];

  @ApiProperty({
    description: '레시피 건강 포인트들',
    type: [CreateRecipeHealthPointDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeHealthPointDto)
  @IsOptional()
  healthPoints?: CreateRecipeHealthPointDto[];

  @ApiProperty({
    description: '컨디션별 가중치들',
    type: [CreateRecipeConditionWeightDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeConditionWeightDto)
  @IsOptional()
  conditionWeights?: CreateRecipeConditionWeightDto[];
}
