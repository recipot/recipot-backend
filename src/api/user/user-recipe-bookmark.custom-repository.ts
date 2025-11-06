import { UserRecipeBookmark } from '@/database/entity/user-recipe-bookmark.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { BookmarkWithRecipeDto } from './dto/bookmark-with-recipe.dto';
@Injectable()
export class UserRecipeBookmarkCustomRepository extends Repository<UserRecipeBookmark> {
  constructor(private dataSource: DataSource) {
    super(UserRecipeBookmark, dataSource.createEntityManager());
  }
  /**
   * 사용자의 북마크와 레시피 정보를 페이지네이션으로 조회합니다.
   */
  async findBookmarksWithRecipeByUserIdPaginated(
    userId: number,
    page: number,
    limit: number,
  ): Promise<{
    items: BookmarkWithRecipeDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryBuilder = this.dataSource
      .createQueryBuilder()
      .select([
        'bookmark.id as bookmark_id',
        'bookmark.user_id as bookmark_user_id',
        'bookmark.recipe_id as bookmark_recipe_id',
        'bookmark.created_at as bookmark_created_at',
        'recipe.title as recipe_title',
        'recipe.description as recipe_description',
        'image.image_url as recipe_image',
      ])
      .from('user_recipe_bookmarks', 'bookmark')
      .innerJoin(
        'recipes',
        'recipe',
        'bookmark.recipe_id = recipe.id AND recipe.deleted_at IS NULL',
      )
      .leftJoin('recipe_images', 'image', 'recipe.id = image.recipe_id')
      .where('bookmark.user_id = :userId', { userId })
      .orderBy('bookmark.created_at', 'DESC');
    const rawResults = await queryBuilder.getRawMany();
    const bookmarkMap = new Map<number, BookmarkWithRecipeDto>();
    for (const result of rawResults) {
      if (!bookmarkMap.has(result.bookmark_id)) {
        bookmarkMap.set(result.bookmark_id, {
          id: result.bookmark_id,
          userId: result.bookmark_user_id,
          recipeId: result.bookmark_recipe_id,
          recipeTitle: result.recipe_title,
          recipeDescription: result.recipe_description,
          recipeImages: result.recipe_image ? [result.recipe_image] : [],
          createdAt: result.bookmark_created_at,
        });
      } else {
        // 이미 존재하는 북마크에 이미지 추가 (모든 이미지 포함)
        const existingBookmark = bookmarkMap.get(result.bookmark_id)!;
        if (result.recipe_image) {
          existingBookmark.recipeImages.push(result.recipe_image);
        }
      }
    }
    const allBookmarks = Array.from(bookmarkMap.values());
    const total = allBookmarks.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const items = allBookmarks.slice(offset, offset + limit);
    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }
  /**
   * 사용자가 특정 레시피를 북마크했는지 확인합니다.
   */
  async existsByUserIdAndRecipeId(
    userId: number,
    recipeId: number,
  ): Promise<boolean> {
    const queryBuilder = this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('user_recipe_bookmarks', 'bookmark')
      .where('bookmark.user_id = :userId', { userId })
      .andWhere('bookmark.recipe_id = :recipeId', { recipeId });
    const result = await queryBuilder.getRawOne();
    return parseInt(result.count) > 0;
  }

  /**
   * 사용자의 북마크 개수를 조회합니다.
   */
  async countByUserId(userId: number): Promise<number> {
    const queryBuilder = this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('user_recipe_bookmarks', 'bookmark')
      .where('bookmark.user_id = :userId', { userId });
    const result = await queryBuilder.getRawOne();
    return parseInt(result.count);
  }
}
