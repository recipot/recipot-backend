import { Column, Entity, OneToMany } from 'typeorm';
import { CommonEntity } from './common.entity';
import { RecipeImage } from './recipe-image.entity';
import { RecipeIngredient } from './recipe-ingredient.entity';
import { RecipeSeasoning } from './recipe-seasoning.entity';
import { RecipeTool } from './recipe-tool.entity';
import { RecipeStep } from './recipe-step.entity';
import { RecipeHealthPoint } from './recipe-health-point.entity';

@Entity('recipes')
export class Recipe extends CommonEntity {
  @Column({
    type: 'varchar',
    nullable: false,
    comment: '제목',
  })
  title: string;

  @Column({
    type: 'text',
    nullable: false,
    comment: '설명',
  })
  description: string;

  @Column({
    type: 'varchar',
    length: 6,
    nullable: false,
    comment: '소요 시간',
  })
  duration: string;

  @Column({
    type: 'varchar',
    nullable: false,
    comment: '조리 난이도',
  })
  level: string;

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
