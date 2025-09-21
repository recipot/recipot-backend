import { DataSource } from 'typeorm';
import { Condition } from '../entity/condition.entity';

export class ConditionSeed {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    if (!this.dataSource || !this.dataSource.manager) {
      throw new Error('DataSource or manager is not available');
    }

    const conditionRepository =
      this.dataSource.manager.getRepository(Condition);

    // 컨디션 데이터 정의
    const conditionsData = [
      { name: '힘들어' },
      { name: '그럭저럭' },
      { name: '충분해' },
    ];

    // 기존 컨디션 확인 및 생성
    for (const conditionData of conditionsData) {
      const existingCondition = await conditionRepository.findOne({
        where: { name: conditionData.name },
      });

      if (!existingCondition) {
        const condition = conditionRepository.create(conditionData);
        await conditionRepository.save(condition);
      }
    }
  }
}
