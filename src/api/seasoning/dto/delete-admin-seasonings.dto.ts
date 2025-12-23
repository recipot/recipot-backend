import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayMinSize, IsNumber } from 'class-validator';

/**
 * [어드민] 양념 다중 삭제 요청 DTO
 */
export class DeleteAdminSeasoningsDto {
  @ApiProperty({
    description: '삭제할 양념 ID 배열',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsArray()
  @ArrayMinSize(1, { message: '최소 1개 이상의 ID가 필요합니다' })
  @IsNumber({}, { each: true, message: '각 ID는 숫자여야 합니다' })
  ids: number[];
}

/**
 * [어드민] 양념 다중 삭제 응답 DTO
 */
export class DeleteAdminSeasoningsResponseDto {
  @ApiProperty({
    description: '삭제된 양념 개수',
    example: 3,
  })
  deletedCount: number;
}
