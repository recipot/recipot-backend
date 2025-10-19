import { ApiProperty } from '@nestjs/swagger';

export class MeasurementGuideDetailDto {
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
}

export class GetMeasurementGuidesResponseDto {
  @ApiProperty({
    description: '계량 카테고리명을 키로, 계량 정보 배열을 값으로',
    type: 'object',
    additionalProperties: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          standard: { type: 'string', example: '큰술' },
          imageUrl: {
            type: 'string',
            example: 'https://s3.../measurement-1.png',
            nullable: true,
          },
          description: {
            type: 'string',
            example: '밥숟가락을 기준으로 계량합니다',
          },
        },
      },
    },
    example: {
      가루류: [
        {
          standard: '큰술',
          imageUrl: 'https://s3.../measurement-1.png',
          description: '밥숟가락을 기준으로 계량합니다',
        },
        {
          standard: '작은술',
          imageUrl: 'https://s3.../measurement-1.png',
          description: '작은 숟가락을 기준으로 계량합니다',
        },
      ],
      액체류: [
        {
          standard: '컵',
          imageUrl: 'https://s3.../measurement-2.png',
          description: '계량컵을 기준으로 계량합니다',
        },
      ],
    },
  })
  data: { [categoryCodeName: string]: MeasurementGuideDetailDto[] };
}
