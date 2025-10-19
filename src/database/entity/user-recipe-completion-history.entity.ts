import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('user_recipe_completion_history')
export class UserRecipeCompletionHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ name: 'recipe_id', type: 'int' })
  recipeId: number;

  @Column({
    name: 'completed_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  completedAt: Date;
}
