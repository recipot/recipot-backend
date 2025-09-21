import { ApiProperty } from '@nestjs/swagger';

export class RecipeImageDto {
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
  imageUrl: string;
}

export class IngredientItemDto {
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
  isAlternative: boolean;
}

export class RecipeIngredientDto {
  @ApiProperty({
    description: '보유 재료 목록',
    type: [IngredientItemDto],
    isArray: true,
  })
  owned: IngredientItemDto[];

  @ApiProperty({
    description: '미보유 재료 목록',
    type: [IngredientItemDto],
    isArray: true,
  })
  notOwned: IngredientItemDto[];

  @ApiProperty({
    description: '대체불가 재료 목록',
    type: [IngredientItemDto],
    isArray: true,
  })
  alternativeUnavailable: IngredientItemDto[];
}

export class RecipeSeasoningDto {
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

export class RecipeToolDto {
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

  @ApiProperty({
    description: '조리도구 이미지 주소',
    example: 'https://example.com/pan.jpg',
    type: 'string',
  })
  imageUrl: string;
}

export class RecipeStepDto {
  @ApiProperty({
    description: '순서',
    example: 1,
    type: 'number',
  })
  orderNum: number;

  @ApiProperty({
    description: '단계 요약',
    example: '고등어 손질하기',
    type: 'string',
  })
  summary: string;
}

export class RecipeConditionDto {
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

export class RecipeHealthPointDto {
  @ApiProperty({
    description: '건강 포인트 내용',
    example: '고등어의 오메가3가 심혈관 건강에 도움을 줍니다',
    type: 'string',
  })
  content: string;
}

export class GetRecipeResponseDto {
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
    example: '30',
    type: 'string',
  })
  duration: string;

  @ApiProperty({
    description: '컨디션 정보',
    type: RecipeConditionDto,
  })
  condition: RecipeConditionDto;

  @ApiProperty({
    description: '레시피 이미지 배열',
    type: [RecipeImageDto],
    isArray: true,
  })
  images: RecipeImageDto[];

  @ApiProperty({
    description: '레시피 재료 (카테고리별로 분류)',
    type: RecipeIngredientDto,
  })
  ingredients: RecipeIngredientDto;

  @ApiProperty({
    description: '레시피 양념 배열',
    type: [RecipeSeasoningDto],
    isArray: true,
  })
  seasonings: RecipeSeasoningDto[];

  @ApiProperty({
    description: '레시피 조리도구 배열',
    type: [RecipeToolDto],
    isArray: true,
  })
  tools: RecipeToolDto[];

  @ApiProperty({
    description: '요리 순서 배열',
    type: [RecipeStepDto],
    isArray: true,
  })
  steps: RecipeStepDto[];

  @ApiProperty({
    description: '건강 포인트 배열',
    type: [RecipeHealthPointDto],
    isArray: true,
  })
  healthPoints: RecipeHealthPointDto[];
}
