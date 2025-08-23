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
   * 사용자의 북마크와 레시피 정보를 함께 조회합니다.
   */
  async findBookmarksWithRecipeByUserId(
    userId: number,
  ): Promise<BookmarkWithRecipeDto[]> {
    const queryBuilder = this.dataSource
      .createQueryBuilder()
      .select([
        'bookmark.id',
        'bookmark.user_id',
        'bookmark.recipe_id',
        'bookmark.created_at',
        'recipe.description',
        'recipe.duration',
        'recipe.level',
        'recipe.method',
        'recipe.washing_level',
        'image.image_url as recipe_image',
      ])
      .from('user_recipe_bookmarks', 'bookmark')
      .leftJoin('recipes', 'recipe', 'bookmark.recipe_id = recipe.id')
      .leftJoin('recipe_images', 'image', 'recipe.id = image.recipe_id')
      .where('bookmark.user_id = :userId', { userId })
      .orderBy('bookmark.created_at', 'DESC');

    const rawResults = await queryBuilder.getRawMany();

    // 결과를 북마크별로 그룹핑하고 이미지는 랜덤으로 하나만 선택
    const bookmarkMap = new Map<number, BookmarkWithRecipeDto>();

    for (const result of rawResults) {
      if (!bookmarkMap.has(result.id)) {
        bookmarkMap.set(result.id, {
          id: result.id,
          user_id: result.user_id,
          recipe_id: result.recipe_id,
          recipe_description: result.recipe_description,
          recipe_duration: result.recipe_duration,
          recipe_level: result.recipe_level,
          recipe_method: result.recipe_method,
          recipe_washing_level: result.recipe_washing_level,
          recipe_images: result.recipe_image ? [result.recipe_image] : [],
          created_at: result.created_at,
        });
      } else {
        // 이미 존재하는 북마크에 이미지 추가 (모든 이미지 포함)
        const existingBookmark = bookmarkMap.get(result.id)!;
        if (result.recipe_image) {
          existingBookmark.recipe_images.push(result.recipe_image);
        }
      }
    }

    return Array.from(bookmarkMap.values());
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
}
