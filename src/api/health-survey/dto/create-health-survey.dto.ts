import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateHealthSurveyRequestDto {
  @ApiProperty({
    description: '평소 겪던 건강 문제 코드 (공통 코드 H01)',
    example: 'H01002',
  })
  @IsString()
  @IsNotEmpty()
  persistentIssueCode: string;

  @ApiProperty({
    description: '느낀 변화 코드 목록 (공통 코드 H02)',
    example: ['H02001', 'H02004'],
    type: [String],
  })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  effectCodes: string[];

  @ApiProperty({
    description: '자유 서술 응답',
    example: '최근에 속이 훨씬 편안해졌어요.',
    required: false,
    nullable: true,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  additionalNote?: string;
}

export class CreateHealthSurveyResponseDto {
  @ApiProperty({
    description: '작성된 건강 설문 ID',
    example: 42,
  })
  surveyId: number;
}
