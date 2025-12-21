import { PaginationDto } from '@/common/dto/pagination.dto';
import { ApiProperty } from '@nestjs/swagger';

/**
 * [어드민] 식재료 목록 조회 요청 DTO
 */
export class GetAdminIngredientsDto extends PaginationDto {}

/**
 * 건강 정보 응답 DTO
 */
export class HealthInfoDto {
  @ApiProperty({
    description: '건강 정보 내용',
    example: '오메가-3 지방산이 풍부하여 심혈관 건강에 도움이 됩니다.',
    nullable: true,
  })
  content: string | null;
}

/**
 * [어드민] 식재료 응답 DTO
 */
export class AdminIngredientDto {
  @ApiProperty({
    description: '재료 ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: '재료명',
    example: '고등어',
  })
  name: string;

  @ApiProperty({
    description: '카테고리 이름',
    example: '해산물류',
  })
  categoryName: string;

  @ApiProperty({
    description: '온보딩 단계에서 노출하는 제한 식품 여부',
    example: false,
  })
  isRestrictedIngredient: boolean;

  @ApiProperty({
    description: '건강 정보 목록',
    type: [HealthInfoDto],
  })
  healthInfos: HealthInfoDto[];
}

/**
 * [어드민] 식재료 목록 조회 응답 DTO
 */
export class GetAdminIngredientsResponseDto {
  @ApiProperty({
    description: '식재료 목록',
    type: [AdminIngredientDto],
  })
  data: AdminIngredientDto[];

  @ApiProperty({
    description: '전체 식재료 개수',
    example: 100,
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
