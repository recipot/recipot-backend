import { DataSource } from 'typeorm';
import { IngredientCategory } from '../entity/ingredient-category.entity';

export class IngredientCategorySeed {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    if (!this.dataSource || !this.dataSource.manager) {
      throw new Error('DataSource or manager is not available');
    }

    const repository =
      this.dataSource.manager.getRepository(IngredientCategory);

    // 기존 데이터가 있는지 확인
    const existingCount = await repository.count();
    if (existingCount > 0) {
      console.log('IngredientCategory data already exists, skipping seed');
      return;
    }

    // 재료 카테고리 시드 데이터
    const categories = [
      { name: '해산물류' },
      { name: '육류 및 유제품' },
      { name: '견과류 및 곡류' },
      { name: '기타' },
    ];

    // 데이터 저장
    await repository.save(categories);

    console.log('IngredientCategorySeed executed successfully');
  }
}
