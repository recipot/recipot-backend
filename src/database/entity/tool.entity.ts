import { Column, Entity } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('tools')
export class Tool extends CommonEntity {
  @Column({
    type: 'varchar',
    nullable: false,
    comment: '조리 도구 이름',
  })
  name: string;

  @Column({
    type: 'varchar',
    nullable: false,
    comment: '조리 도구 이미지 주소',
  })
  image_url: string;
}
