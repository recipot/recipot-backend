import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsDate,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrphanedFileDto {
  @ApiProperty({
    description: 'S3 Key (uploads/ 경로 포함)',
    example: 'uploads/uuid-1.jpg',
  })
  @IsString()
  key: string;

  @ApiProperty({
    description: '파일 크기 (바이트)',
    example: 2048576,
  })
  @IsNumber()
  size: number;

  @ApiProperty({
    description: '파일 생성 시간',
    example: '2025-11-09T10:30:00Z',
  })
  @Type(() => Date)
  @IsDate()
  lastModified: Date;
}

export class GetOrphanedFilesResponseDto {
  @ApiProperty({
    description: '고아 파일 총 개수',
    example: 12,
  })
  @IsNumber()
  totalOrphanedCount: number;

  @ApiProperty({
    description: '감지된 고아 파일 목록',
    type: [OrphanedFileDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrphanedFileDto)
  orphanedFiles: OrphanedFileDto[];
}
