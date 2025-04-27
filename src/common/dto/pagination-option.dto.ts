import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { IPaginationOptions } from 'nestjs-typeorm-paginate';
import { Type } from 'class-transformer';

export class PaginationOptionsDto implements IPaginationOptions {
  @ApiProperty({ example: '1', description: '페이지', default: 1 })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  public page: number;

  @ApiProperty({ example: '10', description: '리밋', default: 10 })
  @IsInt()
  @Min(1)
  @Max(999)
  @Type(() => Number)
  public limit: number;

  @ApiProperty({
    example: 'createdAt',
    description: '정렬 기준',
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  public sortBy?: string;

  @ApiProperty({ example: 'desc', description: '정렬 순서', default: 'desc' })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  public order?: 'asc' | 'desc';
}
