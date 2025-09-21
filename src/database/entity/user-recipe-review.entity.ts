import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CommonEntity } from './common.entity';
import { Recipe } from './recipe.entity';
import { User } from './user.entity';

@Entity('user_recipe_reviews')
export class UserRecipeReview extends CommonEntity {
  @Column({
    type: 'int',
    nullable: false,
    name: 'user_id',
    comment: '유저 PK',
  })
  userId: number;

  @Column({
    type: 'int',
    nullable: false,
    name: 'recipe_id',
    comment: '레시피 PK',
  })
  recipeId: number;

  @Column({
    type: 'varchar',
    length: 6,
    nullable: false,
    comment: '만족도',
  })
  satisfaction: string;

  @Column({
    type: 'varchar',
    length: 6,
    nullable: true,
    name: 'taste_code',
    comment: '맛 평가 코드',
  })
  tasteCode: string | null;

  @Column({
    type: 'varchar',
    length: 6,
    nullable: true,
    name: 'difficulty_code',
    comment: '요리 시작 난이도 코드',
  })
  difficultyCode: string | null;

  @Column({
    type: 'varchar',
    length: 6,
    nullable: true,
    name: 'experience_code',
    comment: '요리 경험 코드',
  })
  experienceCode: string | null;

  @Column({
    type: 'text',
    nullable: true,
    comment: '리뷰 내용',
  })
  content: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Recipe)
  @JoinColumn({ name: 'recipe_id' })
  recipe: Recipe;
}
