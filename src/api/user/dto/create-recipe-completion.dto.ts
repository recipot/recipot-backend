import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CreateRecipeCompletionRequestDto {
  @ApiProperty({ description: '레시피 PK', example: 10 })
  @IsInt()
  @Min(1)
  recipeId: number;
}
