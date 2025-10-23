import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CompletedRecipeWithRecipeDto } from './dto/completed-recipe-with-recipe.dto';

@Injectable()
export class UserCompletedRecipeCustomRepository extends Repository<any> {
  constructor(private dataSource: DataSource) {
    super(Object as any, dataSource.createEntityManager());
  }

  async findCompletedRecipesWithRecipeByUserIdPaginated(
    userId: number,
    page: number,
    limit: number,
  ): Promise<{
    items: CompletedRecipeWithRecipeDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const qb = this.dataSource
      .createQueryBuilder()
      .select([
        'completed.id as completed_id',
        'completed.user_id as completed_user_id',
        'completed.recipe_id as completed_recipe_id',
        'completed.is_completed as completed_is_completed',
        'completed.is_reviewed as completed_is_reviewed',
        'completed.created_at as completed_created_at',
        'recipe.title as recipe_title',
        'recipe.description as recipe_description',
        'image.image_url as recipe_image',
        'CASE WHEN bookmark.id IS NOT NULL THEN 1 ELSE 0 END as is_bookmarked',
      ])
      .from('user_completed_recipes', 'completed')
      .leftJoin('recipes', 'recipe', 'completed.recipe_id = recipe.id')
      .leftJoin('recipe_images', 'image', 'recipe.id = image.recipe_id')
      .leftJoin(
        'user_recipe_bookmarks',
        'bookmark',
        'completed.user_id = bookmark.user_id AND completed.recipe_id = bookmark.recipe_id',
      )
      .where('completed.user_id = :userId', { userId })
      .andWhere('completed.is_completed = :isCompleted', { isCompleted: true })
      .orderBy('completed.created_at', 'DESC');

    const raw = await qb.getRawMany();

    const map = new Map<number, CompletedRecipeWithRecipeDto>();
    for (const row of raw) {
      if (!map.has(row.completed_id)) {
        map.set(row.completed_id, {
          id: row.completed_id,
          userId: row.completed_user_id,
          recipeId: row.completed_recipe_id,
          recipeTitle: row.recipe_title,
          recipeDescription: row.recipe_description,
          recipeImages: row.recipe_image ? [row.recipe_image] : [],
          isCompleted: row.completed_is_completed,
          isReviewed: row.completed_is_reviewed,
          createdAt: row.completed_created_at,
          isBookmarked: Boolean(row.is_bookmarked),
        });
      } else {
        const existing = map.get(row.completed_id)!;
        if (row.recipe_image) existing.recipeImages.push(row.recipe_image);
      }
    }

    const all = Array.from(map.values());
    const total = all.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const items = all.slice(offset, offset + limit);

    return { items, total, page, limit, totalPages };
  }
}
