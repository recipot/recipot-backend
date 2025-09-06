import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CommonEntity } from './common.entity';
import { Recipe } from './recipe.entity';
import { Tool } from './tool.entity';

@Entity('recipe_tools')
export class RecipeTool extends CommonEntity {
  @Column({
    type: 'int',
    nullable: false,
    comment: '레시피 PK',
  })
  recipe_id: number;

  @Column({
    type: 'int',
    nullable: false,
    comment: '도구 PK',
  })
  tool_id: number;

  @ManyToOne(() => Recipe, (recipe) => recipe.tools)
  @JoinColumn({ name: 'recipe_id' })
  recipe: Recipe;

  @ManyToOne(() => Tool)
  @JoinColumn({ name: 'tool_id' })
  tool: Tool;
}
