import { ApiProperty } from '@nestjs/swagger';

export class AdminRecipeImageDto {
  @ApiProperty({
    description: '이미지 ID',
    example: 1,
    type: 'number',
  })
  id: number;

  @ApiProperty({
    description: '레시피 이미지 주소',
    example: 'https://example.com/recipe.jpg',
    type: 'string',
  })
  image_url: string;
}

export class AdminRecipeIngredientDto {
  @ApiProperty({
    description: '재료 ID',
    example: 1,
    type: 'number',
  })
  id: number;

  @ApiProperty({
    description: '재료 이름',
    example: '고등어',
    type: 'string',
  })
  name: string;

  @ApiProperty({
    description: '필요량',
    example: '1마리',
    type: 'string',
  })
  amount: string;

  @ApiProperty({
    description: '대체 가능 여부',
    example: false,
    type: 'boolean',
  })
  is_alternative: boolean;
}

export class AdminRecipeSeasoningDto {
  @ApiProperty({
    description: '양념 ID',
    example: 1,
    type: 'number',
  })
  id: number;

  @ApiProperty({
    description: '양념 이름',
    example: '간장',
    type: 'string',
  })
  name: string;

  @ApiProperty({
    description: '필요량',
    example: '2큰술',
    type: 'string',
  })
  amount: string;
}

export class AdminRecipeToolDto {
  @ApiProperty({
    description: '조리도구 ID',
    example: 1,
    type: 'number',
  })
  id: number;

  @ApiProperty({
    description: '조리도구 이름',
    example: '프라이팬(원팬)',
    type: 'string',
  })
  name: string;
}

export class AdminRecipeStepDto {
  @ApiProperty({
    description: '순서',
    example: 1,
    type: 'number',
  })
  order_num: number;

  @ApiProperty({
    description: '단계 요약',
    example: '고등어 손질하기',
    type: 'string',
  })
  summary: string;

  @ApiProperty({
    description: '조리 단계 본문',
    example: '고등어를 깨끗이 씻어서 3등분으로 자릅니다.',
    type: 'string',
  })
  content: string;

  @ApiProperty({
    description: '요리 예시 이미지 주소',
    example: 'https://example.com/step1.jpg',
    type: 'string',
    nullable: true,
  })
  image_url: string | null;
}

export class AdminRecipeConditionDto {
  @ApiProperty({
    description: '컨디션 ID',
    example: 1,
    type: 'number',
  })
  id: number;

  @ApiProperty({
    description: '컨디션 이름',
    example: '힘들어',
    type: 'string',
  })
  name: string;
}

export class AdminRecipeListItemDto {
  @ApiProperty({
    description: '레시피 ID',
    example: 1,
    type: 'number',
  })
  id: number;

  @ApiProperty({
    description: '레시피 제목',
    example: '간장 고등어 구이',
    type: 'string',
  })
  title: string;

  @ApiProperty({
    description: '레시피 설명',
    example: '고소하고 짭짤한 간장 고등어 구이입니다. 밥반찬으로 최고!',
    type: 'string',
  })
  description: string;

  @ApiProperty({
    description: '소요 시간 (분)',
    example: 30,
    type: 'number',
  })
  duration: number;

  @ApiProperty({
    description: '컨디션 정보 (priorityScore가 1.0인 컨디션)',
    type: AdminRecipeConditionDto,
    nullable: true,
  })
  condition_info: AdminRecipeConditionDto | null;

  @ApiProperty({
    description: '레시피 이미지 배열',
    type: [AdminRecipeImageDto],
    isArray: true,
  })
  images: AdminRecipeImageDto[];

  @ApiProperty({
    description: '레시피 재료 배열',
    type: [AdminRecipeIngredientDto],
    isArray: true,
  })
  ingredients: AdminRecipeIngredientDto[];

  @ApiProperty({
    description: '레시피 양념 배열',
    type: [AdminRecipeSeasoningDto],
    isArray: true,
  })
  seasonings: AdminRecipeSeasoningDto[];

  @ApiProperty({
    description: '레시피 조리도구 배열',
    type: [AdminRecipeToolDto],
    isArray: true,
  })
  tools: AdminRecipeToolDto[];

  @ApiProperty({
    description: '요리 순서 배열',
    type: [AdminRecipeStepDto],
    isArray: true,
  })
  steps: AdminRecipeStepDto[];
}
