import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * 기본 페이지네이션을 위한 DTO
 */
export class PageQueryDto {
  @ApiProperty({
    description: '페이지 번호',
    required: false,
    default: 1,
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  public page: number = 1;

  @ApiProperty({
    description: '페이지 당 항목 수',
    required: false,
    default: 10,
    example: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  public limit: number = 10;
}

/**
 * 날짜 필터링 및 정렬 기능이 추가된 페이지네이션 DTO
 */
export class PaginationDtoTx extends PageQueryDto {
  @ApiProperty({
    example: '2025-01-01',
    description: '조회 시작 날짜 (YYYY-MM-DD 형식)',
    required: false,
  })
  @IsOptional()
  @IsString()
  public startDate?: string;

  @ApiProperty({
    example: '2025-12-31',
    description: '조회 종료 날짜 (YYYY-MM-DD 형식)',
    required: false,
  })
  @IsOptional()
  @IsString()
  public endDate?: string;

  @ApiProperty({
    example: 'createdAt',
    description: '정렬 기준',
    required: false,
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  public sortBy?: string = 'createdAt';

  @ApiProperty({
    example: 'desc',
    description: "정렬 순서 ('asc' 또는 'desc')",
    required: false,
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  public order?: 'asc' | 'desc' = 'desc';
}
