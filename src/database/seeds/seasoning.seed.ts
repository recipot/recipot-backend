import { DataSource } from 'typeorm';
import { Seasoning } from '../entity/seasoning.entity';

export class SeasoningSeed {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    if (!this.dataSource || !this.dataSource.manager) {
      throw new Error('DataSource or manager is not available');
    }

    const seasoningRepository =
      this.dataSource.manager.getRepository(Seasoning);

    const existingCount = await seasoningRepository.count();
    if (existingCount > 0) {
      console.log('Seasoning data already exists, skipping seed');
      return;
    }

    const seasonings = [
      { name: '소금' },
      { name: '굵은소금' },
      { name: '깨소금' },
      { name: '맛소금' },
      { name: '허브솔트' },
      { name: '설탕' },
      { name: '스테비아' },
      { name: '후춧가루' },
      { name: '고춧가루' },
      { name: '된장' },
      { name: '고추장' },
      { name: '간장' },
      { name: '진간장' },
      { name: '국간장' },
      { name: '양조간장' },
      { name: '참치액' },
      { name: '액젓' },
      { name: '올리고당' },
      { name: '알룰로스' },
      { name: '식초' },
      { name: '굴소스' },
      { name: '레몬즙' },
      { name: '매실액' },
      { name: '맛술' },
      { name: '식용유' },
      { name: '올리브유' },
      { name: '참기름' },
      { name: '들기름' },
      { name: '물' },
      { name: '다진마늘' },
      { name: '치킨스톡' },
    ];

    await seasoningRepository.save(seasonings);

    console.log('SeasoningSeed executed successfully');
  }
}
