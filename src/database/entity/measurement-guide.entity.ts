import { Column, Entity } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('measurement_guides')
export class MeasurementGuide extends CommonEntity {
  @Column({
    type: 'varchar',
    name: 'category_name',
    nullable: false,
    comment: '계량 카테고리 이름 (예: 스푼류, 컵, 무게 등)',
  })
  categoryName: string;

  @Column({
    type: 'varchar',
    name: 'measurement_standard',
    nullable: false,
    comment: '계량 기준 (예: 큰술, 작은술, 컵, 그램 등)',
  })
  measurementStandard: string;

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
