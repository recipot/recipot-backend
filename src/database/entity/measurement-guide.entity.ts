import { Column, Entity } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('measurement_guides')
export class MeasurementGuide extends CommonEntity {
  @Column({
    type: 'varchar',
    length: 6,
    name: 'category_code',
    nullable: false,
    comment: '계량 카테고리 코드 (CommonCode M01001, M01002 등)',
  })
  categoryCode: string;

  @Column({
    type: 'varchar',
    name: 'standard',
    nullable: false,
    comment: '계량 기준 (예: 큰술, 작은술, 컵, 그램 등)',
  })
  standard: string;

  @Column({
    type: 'varchar',
    name: 'image_url',
    nullable: true,
    comment: '계량 이미지 URL (S3)',
  })
  imageUrl?: string;

  @Column({
    type: 'text',
    nullable: false,
    comment: '계량 설명 (예: "밥숟가락 기준으로 계량합니다")',
  })
  description: string;
}
