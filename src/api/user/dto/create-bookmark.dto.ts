import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateBookmarkDto {
  @ApiProperty({
    description: '북마크할 레시피 ID',
    example: 1,
    type: 'number',
  })
  @IsNumber()
  @IsNotEmpty()
  recipe_id: number;
}
