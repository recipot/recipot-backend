import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateMeasurementGuideDto {
  @ApiProperty({
    description:
      '계량 카테고리 코드 (CommonCode M01001, M01002, M01003, M01004)',
    example: 'M01001',
  })
  @IsString()
  @IsNotEmpty()
  categoryCode: string;

  @ApiProperty({
    description: '계량 기준 (예: 큰술, 작은술, 컵, 그램 등)',
    example: '큰술',
  })
  @IsString()
  @IsNotEmpty()
  standard: string;

  @ApiProperty({
    description: '계량 이미지 URL (S3)',
    example: 'https://s3.../measurement-1.png',
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({
    description: '계량 설명 (예: "밥숟가락 기준으로 계량합니다")',
    example: '밥숟가락을 기준으로 계량합니다',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class CreateMeasurementGuideRequestDto {
  @ApiProperty({
    description: '생성할 계량 가이드 객체들의 배열',
    type: [CreateMeasurementGuideDto],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateMeasurementGuideDto)
  data: CreateMeasurementGuideDto[];
}

export class MeasurementGuideResponseDto {
  @ApiProperty({ description: '계량 가이드 ID', example: 1 })
  id: number;

  @ApiProperty({
    description: '계량 카테고리 이름',
    example: '스푼류',
  })
  name: string;

  @ApiProperty({
    description: '계량 기준',
    example: '큰술',
  })
  standard: string;

  @ApiProperty({
    description: '계량 이미지 URL (S3)',
    example: 'https://s3.../measurement-1.png',
    required: false,
  })
  imageUrl?: string;

  @ApiProperty({
    description: '계량 설명',
    example: '밥숟가락을 기준으로 계량합니다',
  })
  description: string;

  @ApiProperty({ description: '생성일시', example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시', example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
