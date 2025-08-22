import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCommonCodeDto {
  @ApiProperty({ description: '그룹 코드', example: 'C01' })
  @IsString()
  @IsNotEmpty()
  group_code: string;

  @ApiProperty({ description: '그룹 코드명', example: '소셜 로그인' })
  @IsString()
  @IsNotEmpty()
  group_code_name: string;

  @ApiProperty({ description: '코드', example: 'C01001' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: '코드명', example: '카카오' })
  @IsString()
  @IsNotEmpty()
  code_name: string;

  @ApiProperty({ description: '그룹명', example: '소셜 로그인' })
  @IsString()
  @IsNotEmpty()
  group_name: string;

  @ApiProperty({ description: '정렬 순서', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  order_num: number;

  @ApiProperty({ description: '코드 깊이', example: 2 })
  @IsNumber()
  @IsNotEmpty()
  depth: number;

  @ApiProperty({
    description: '사용 여부 (기본값: true)',
    required: false,
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
