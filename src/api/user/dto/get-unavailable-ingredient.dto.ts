import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class GetUnavailableIngredientsRequestDto {
  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiProperty({ example: 20, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;
}

export class UnavailableIngredientItemDto {
  @ApiProperty({ example: 7 }) id: number;
  @ApiProperty({ example: '고등어' }) name: string;
  @ApiProperty({ example: '생선' }) categoryName: string | null;
}

export class GetUnavailableIngredientsResponseDto {
  @ApiProperty({ type: [UnavailableIngredientItemDto] })
  items: UnavailableIngredientItemDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}
