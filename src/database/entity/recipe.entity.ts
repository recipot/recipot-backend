import { Column, Entity, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { CommonEntity } from './common.entity';
import { RecipeImage } from './recipe-image.entity';
import { RecipeIngredient } from './recipe-ingredient.entity';
import { RecipeSeasoning } from './recipe-seasoning.entity';
import { RecipeTool } from './recipe-tool.entity';
import { RecipeStep } from './recipe-step.entity';
import { RecipeHealthPoint } from './recipe-health-point.entity';
import { Condition } from './condition.entity';

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
    type: 'int',
    nullable: false,
    comment: '컨디션 PK',
  })
  condition_id: number;

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
