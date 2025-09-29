import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('recipe_tools')
export class RecipeTool {
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
    name: 'tool_id',
    comment: '도구 PK',
  })
  toolId: number;
}
