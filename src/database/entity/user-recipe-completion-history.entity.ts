import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user_recipe_completion_history')
@Index('IDX_urc_user_id_completed_at', ['userId', 'completedAt'])
@Index('IDX_urc_user_id_recipe_id_completed_at', [
  'userId',
  'recipeId',
  'completedAt',
])
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
