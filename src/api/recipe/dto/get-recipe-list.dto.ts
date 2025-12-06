import { ApiProperty } from '@nestjs/swagger';

export class RecipeListToolDto {
  @ApiProperty({
    description: '조리도구 ID',
    example: 1,
    type: 'number',
  })
  id: number;

  @ApiProperty({
    description: '조리도구 이름',
    example: '도마',
    type: 'string',
  })
  name: string;

  // TODO: 조리도구 이미지 nullable로 가져갈 것인지 확인 후 추가, 당장 어드민에는 불필요
  // @ApiProperty({
  //   description: '조리도구 이미지 주소',
  //   example: 'https://example.com/pan.jpg',
  //   type: 'string',
  // })
  // imageUrl: string;
}

export class RecipeListIngredientDto {
  @ApiProperty({
    description: '재료 ID',
    example: 1,
    type: 'number',
  })
  id: number;

  @ApiProperty({
    description: '재료 이름',
    example: '부채살',
    type: 'string',
  })
  name: string;

  @ApiProperty({
    description: '필요량',
    example: '80g',
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

export class RecipeListSeasoningDto {
  @ApiProperty({
    description: '양념 ID',
    example: 1,
    type: 'number',
  })
  id: number;

  @ApiProperty({
    description: '양념 이름',
    example: '플레인요거트',
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

export class RecipeListStepDto {
  @ApiProperty({
    description: '단계 순서',
    example: 1,
    type: 'number',
  })
  orderNum: number;

  @ApiProperty({
    description: '단계 요약',
    example: '컬리플라워를 잘게 다져주세요.',
    nullable: true,
  })
  summary: string | null;

  @ApiProperty({
    description: '조리 단계 본문',
    example: '땅콩버터 한 숟갈을 떠서 식빵에 바른다.',
    nullable: true,
  })
  content: string | null;

  @ApiProperty({
    description: '요리 예시 이미지 주소',
    example: 'https://example.com/step1.jpg',
    nullable: true,
  })
  imageUrl: string | null;
}

export class RecipeListItemDto {
  @ApiProperty({
    description: '레시피 ID',
    example: 1,
    type: 'number',
  })
  id: number;

  @ApiProperty({
    description: '레시피 타이틀',
    example: '컬리플라워 부채살 샐러드랩',
    type: 'string',
  })
  title: string;

  @ApiProperty({
    description: '레시피 이미지 (첫 번째 이미지 URL)',
    example: 'https://example.com/recipe.jpg',
    nullable: true,
    type: 'string',
  })
  imageUrl: string | null;

  @ApiProperty({
    description: '조리 시간 (분)',
    example: 15,
    type: 'number',
  })
  duration: number;

  @ApiProperty({
    description: '유저 컨디션',
    example: '그럭저럭',
    nullable: true,
    type: 'string',
  })
  condition: string | null;

  @ApiProperty({
    description: '한줄 카피',
    example: '빵 위에 땅콩버터와 바나나만 얹으면 끝!',
    type: 'string',
  })
  description: string;

  @ApiProperty({
    description: '조리도구 목록',
    type: [RecipeListToolDto],
  })
  tools: RecipeListToolDto[];

  @ApiProperty({
    description: '재료 목록',
    type: [RecipeListIngredientDto],
  })
  ingredients: RecipeListIngredientDto[];

  @ApiProperty({
    description: '양념 목록',
    type: [RecipeListSeasoningDto],
  })
  seasonings: RecipeListSeasoningDto[];

  @ApiProperty({
    description: '조리 단계 목록 (순서대로 정렬됨)',
    type: [RecipeListStepDto],
  })
  steps: RecipeListStepDto[];
}

export class GetRecipeListResponseDto {
  @ApiProperty({
    description: '레시피 목록',
    type: [RecipeListItemDto],
  })
  items: RecipeListItemDto[];
}
