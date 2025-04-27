import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class PaginationDtoTx {
  @ApiProperty({
    example: '2025-01-01',
    description: '조회 시작 날짜 (YYYY-MM-DD 형식)',
  })
  @IsString()
  public startDate: string;

  @ApiProperty({
    example: '2025-12-31',
    description: '조회 종료 날짜 (YYYY-MM-DD 형식)',
  })
  @IsString()
  public endDate: string;

  @ApiProperty({ example: '1', description: '페이지', default: 1 })
  @IsOptional()
  @IsNumber()
  public page?: number;

  @ApiProperty({ example: '10', description: '리밋', default: 10 })
  @IsOptional()
  @IsNumber()
  public limit?: number;

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
