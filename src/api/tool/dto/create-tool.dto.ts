import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateToolDto {
  @ApiProperty({
    description: '조리 도구 이름',
    example: '후라이팬',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: '조리 도구 이미지 주소',
    example: 'https://example.com/images/frying-pan.jpg',
  })
  @IsString()
  @IsNotEmpty()
  image_url: string;
}

export class CreateToolDtoTx {
  @ApiProperty({
    description: '생성할 조리 도구 객체들의 배열',
    type: [CreateToolDto],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateToolDto)
  data: CreateToolDto[];
}

export class ToolResponseDto {
  @ApiProperty({ description: '조리 도구 ID', example: 1 })
  id: number;

  @ApiProperty({ description: '조리 도구 이름', example: '후라이팬' })
  name: string;

  @ApiProperty({
    description: '조리 도구 이미지 주소',
    example: 'https://example.com/images/frying-pan.jpg',
  })
  imageUrl: string;

  @ApiProperty({ description: '생성일시', example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시', example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
