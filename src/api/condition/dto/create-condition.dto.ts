import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export class CreateConditionDto {
  @ApiProperty({
    description: '컨디션 이름',
    example: '완전 충분해',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CreateConditionDtoTx {
  @ApiProperty({
    description: '생성할 컨디션 데이터',
    type: [CreateConditionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateConditionDto)
  data: CreateConditionDto[];
}

export class ConditionResponseDto {
  @ApiProperty({
    description: '컨디션 ID',
    example: 1,
    type: 'number',
  })
  id: number;

  @ApiProperty({
    description: '컨디션 이름',
    example: '최상의 상태야',
    type: 'string',
  })
  name: string;

  @ApiProperty({
    description: '생성일시',
    type: 'string',
    format: 'date-time',
    example: '2025-09-13T12:15:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: '수정일시',
    type: 'string',
    format: 'date-time',
    example: '2025-09-13T12:15:00.000Z',
  })
  updated_at: Date;
}
