import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { CommonCodeGroupEntity } from '@/database/entity/common-code-group.entity';
import { CommonCodeEntity } from '@/database/entity/common-code.entity';

export default class CommonCodeSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const groupRepo = dataSource.getRepository(CommonCodeGroupEntity);
    dataSource.getRepository(CommonCodeEntity);
    const created_by = 'SYSTEM';

    const exists = await groupRepo.findOneBy({ group_code: 'C01' });
    if (exists) return;

    // 그룹 데이터 정의
    const groupRows = [
      ['C01', 'COOKING_LEVEL', '요리 실력 구분'],
      ['H01', 'HOUSEHOLD_TYPE', '가구 형태 구분'],
      ['J01', 'JOB', '직업 분류'],
    ];

    // 코드 데이터 정의
    const codeRows = [
      // COOKING_LEVEL
      ['C01001', 'C01', '초보자', '요리 실력'],
      ['C01002', 'C01', '숙련자', '요리 실력'],
      ['C01003', 'C01', '전문가', '요리 실력'],
      // HOUSEHOLD_TYPE
      ['H01001', 'H01', '1인 가구', '가구 형태'],
      ['H01002', 'H01', '2인 가구', '가구 형태'],
      ['H01003', 'H01', '3인 이상', '가구 형태'],
      ['H01004', 'H01', '기타', '가구 형태'],
      // JOB
      ['J01001', 'J01', '학생', '직업'],
      ['J01002', 'J01', '주부', '직업'],
      ['J01003', 'J01', '직장인', '직업'],
      ['J01004', 'J01', '무직', '직업'],
      ['J01005', 'J01', '자영업자', '직업'],
      ['J01006', 'J01', '기타', '직업'],
    ];

    const groupData = groupRows.map(([code, name, remark]) => ({
      group_code: code,
      group_name: name,
      remark,
      use_yn: 'Y',
      created_by,
    }));

    const codeData = codeRows.map(([code, group, name, remark], idx) => ({
      code,
      group_code: group,
      name,
      remark,
      sort_order: idx + 1,
      use_yn: 'Y',
      depth: 1,
      created_by,
    }));

    await dataSource.transaction(async (manager) => {
      await manager.getRepository(CommonCodeGroupEntity).save(groupData);
      await manager.getRepository(CommonCodeEntity).save(codeData);
    });
  }
}
