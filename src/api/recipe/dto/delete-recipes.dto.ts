import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsInt, IsNumber } from 'class-validator';

export class DeleteRecipesRequestDto {
  @ApiProperty({
    description: '삭제할 레시피 ID 배열',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty({ message: '최소 1개 이상의 레시피 ID가 필요합니다' })
  @IsNumber({}, { each: true })
  @IsInt({ each: true })
  recipeIds: number[];
}

export class DeleteRecipesResponseDto {
  @ApiProperty({
    description: '삭제된 레시피 개수',
    example: 3,
  })
  deletedCount: number;

  @ApiProperty({
    description: '삭제된 레시피 ID 목록',
    example: [1, 2, 3],
    type: [Number],
  })
  deletedIds: number[];

  @ApiProperty({
    description: '삭제 실패한 레시피 ID 목록',
    example: [],
    type: [Number],
  })
  failedIds: number[];
}
