import { PaginationDto } from '@/common/dto/pagination.dto';
import { ApiProperty } from '@nestjs/swagger';

/**
 * [어드민] 양념 목록 조회 요청 DTO
 */
export class GetAdminSeasoningsDto extends PaginationDto {}

/**
 * [어드민] 양념 응답 DTO
 */
export class AdminSeasoningDto {
  @ApiProperty({
    description: '양념 ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: '양념명',
    example: '간장',
  })
  name: string;
}

/**
 * [어드민] 양념 목록 조회 응답 DTO
 */
export class GetAdminSeasoningsResponseDto {
  @ApiProperty({
    description: '양념 목록',
    type: [AdminSeasoningDto],
  })
  data: AdminSeasoningDto[];

  @ApiProperty({
    description: '전체 양념 개수',
    example: 50,
  })
  total: number;

  @ApiProperty({
    description: '현재 페이지',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: '페이지 당 항목 수',
    example: 10,
  })
  limit: number;
}
