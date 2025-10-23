import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, ArrayUnique, IsInt, Min } from 'class-validator';

export class SaveUnavailableIngredientsDto {
  @ApiPropertyOptional({
    description:
      '저장(대체)할 못 먹는 재료 ID 목록. 빈 배열이면 모두 삭제합니다.',
    example: [12, 34, 56],
  })
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  ingredientIds: number[] = [];
}

export class SaveUnavailableIngredientsResponseDto {
  @ApiPropertyOptional({ example: 3 })
  savedCount?: number;
}
