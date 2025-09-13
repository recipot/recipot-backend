import { Column, Entity } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('recipes')
export class Recipe extends CommonEntity {
  @Column({
    type: 'varchar',
    length: 255,
    comment: '타이틀',
  })
  title: string;

  @Column({
    type: 'text',
    comment: '설명',
  })
  description: string;

  @Column({
    type: 'varchar',
    length: 6,
    comment: '소요 시간',
  })
  duration: string;

  @Column({
    type: 'varchar',
    length: 6,
    comment: '조리 난이도',
  })
  level: string;

  @Column({
    type: 'varchar',
    length: 6,
    comment: '조리 방식',
  })
  method: string;

  @Column({
    type: 'varchar',
    length: 6,
    comment: '설거지 난이도',
  })
  washingLevel: string;
}
