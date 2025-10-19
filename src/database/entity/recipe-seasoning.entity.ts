import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('recipe_seasonings')
export class RecipeSeasoning {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({
    type: 'int',
    nullable: false,
    name: 'recipe_id',
    comment: '레시피 PK',
  })
  recipeId: number;

  @Column({
    type: 'int',
    nullable: false,
    name: 'seasoning_id',
    comment: '양념 PK',
  })
  seasoningId: number;

  @Column({
    type: 'varchar',
    nullable: false,
    comment: '필요량',
  })
  amount: string;
}
