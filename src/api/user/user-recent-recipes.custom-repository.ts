import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { RecentRecipeWithRecipeDto } from './dto/recent-recipe-with-recipe.dto';

@Injectable()
export class UserRecentRecipesCustomRepository extends Repository<any> {
  constructor(private dataSource: DataSource) {
    super(Object as any, dataSource.createEntityManager());
  }

  async findRecentRecipesWithRecipeByUserIdPaginated(
    userId: number,
    page: number,
    limit: number,
  ): Promise<{
    items: RecentRecipeWithRecipeDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const qb = this.dataSource
      .createQueryBuilder()
      .select([
        'recent.id as recent_id',
        'recent.user_id as recent_user_id',
        'recent.recipe_id as recent_recipe_id',
        'recent.created_at as recent_created_at',
        'recipe.title as recipe_title',
        'recipe.description as recipe_description',
        'image.image_url as recipe_image',
        'CASE WHEN bookmark.id IS NOT NULL THEN 1 ELSE 0 END as is_bookmarked',
      ])
      .from('user_recent_recipes', 'recent')
      .leftJoin(
        'recipes',
        'recipe',
        'recent.recipe_id = recipe.id AND recipe.deleted_at IS NULL',
      )
      .leftJoin('recipe_images', 'image', 'recipe.id = image.recipe_id')
      .leftJoin(
        'user_recipe_bookmarks',
        'bookmark',
        'recent.user_id = bookmark.user_id AND recent.recipe_id = bookmark.recipe_id',
      )
      .where('recent.user_id = :userId', { userId })
      .orderBy('recent.created_at', 'DESC');

    const raw = await qb.getRawMany();

    const map = new Map<number, RecentRecipeWithRecipeDto>();
    for (const row of raw) {
      if (!map.has(row.recent_id)) {
        map.set(row.recent_id, {
          id: row.recent_id,
          userId: row.recent_user_id,
          recipeId: row.recent_recipe_id,
          recipeTitle: row.recipe_title,
          recipeDescription: row.recipe_description,
          recipeImages: row.recipe_image ? [row.recipe_image] : [],
          createdAt: row.recent_created_at,
          isBookmarked: Boolean(row.is_bookmarked),
        });
      } else {
        const existing = map.get(row.recent_id)!;
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

  /**
   * 사용자의 최근 레시피 개수를 조회합니다.
   */
  async countByUserId(userId: number): Promise<number> {
    const queryBuilder = this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('user_recent_recipes', 'recent')
      .where('recent.user_id = :userId', { userId });
    const result = await queryBuilder.getRawOne();
    return parseInt(result.count);
  }
}
