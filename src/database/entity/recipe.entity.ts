import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { CommonEntity } from './common.entity';
import { Condition } from './condition.entity';
import { RecipeHealthPoint } from './recipe-health-point.entity';
import { RecipeImage } from './recipe-image.entity';
import { RecipeIngredient } from './recipe-ingredient.entity';
import { RecipeSeasoning } from './recipe-seasoning.entity';
import { RecipeStep } from './recipe-step.entity';
import { RecipeTool } from './recipe-tool.entity';

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
    type: 'int',
    nullable: false,
    name: 'condition_id',
    comment: '컨디션 PK',
  })
  conditionId: number;

  @ManyToOne(() => Condition)
  @JoinColumn({ name: 'condition_id' })
  condition: Condition;

  @OneToMany(() => RecipeImage, (recipeImage) => recipeImage.recipe)
  images: RecipeImage[];

  @OneToMany(
    () => RecipeIngredient,
    (recipeIngredient) => recipeIngredient.recipe,
  )
  ingredients: RecipeIngredient[];

  @OneToMany(() => RecipeSeasoning, (recipeSeasoning) => recipeSeasoning.recipe)
  seasonings: RecipeSeasoning[];

  @OneToMany(() => RecipeTool, (recipeTool) => recipeTool.recipe)
  tools: RecipeTool[];

  @OneToMany(() => RecipeStep, (recipeStep) => recipeStep.recipe)
  steps: RecipeStep[];

  @OneToMany(
    () => RecipeHealthPoint,
    (recipeHealthPoint) => recipeHealthPoint.recipe,
  )
  healthPoints: RecipeHealthPoint[];
}
