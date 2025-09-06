import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateSeasoningDto {
  @ApiProperty({
    description: '양념 이름',
    example: '간장',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CreateSeasoningDtoTx {
  @ApiProperty({
    description: '생성할 양념 객체들의 배열',
    type: [CreateSeasoningDto],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateSeasoningDto)
  data: CreateSeasoningDto[];
}

export class SeasoningResponseDto {
  @ApiProperty({ description: '양념 ID', example: 1 })
  id: number;

  @ApiProperty({ description: '양념 이름', example: '간장' })
  name: string;
}
