import { CommonCodeGroupEntity } from '@/database/entity/common-code-group.entity';
import { CommonCodeEntity } from '@/database/entity/common-code.entity';
import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';

export default class CommonCodeSeeder implements Seeder {
  private static readonly SYSTEM_USER = 'SYSTEM';

  async run(dataSource: DataSource): Promise<void> {
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

    await dataSource.transaction(async (manager) => {
      // 각 그룹별로 존재 여부 확인 후 삽입
      for (const [code, name, remark] of groupRows) {
        const existingGroup = await manager
          .getRepository(CommonCodeGroupEntity)
          .findOneBy({ group_code: code });
        if (!existingGroup) {
          await manager.getRepository(CommonCodeGroupEntity).save({
            group_code: code,
            group_name: name,
            remark,
            use_yn: 'Y',
            created_by: CommonCodeSeeder.SYSTEM_USER,
          });
        }
      }

      // 각 코드별로 존재 여부 확인 후 삽입
      for (const [code, group, name, remark] of codeRows) {
        const existingCode = await manager
          .getRepository(CommonCodeEntity)
          .findOneBy({ code });
        if (!existingCode) {
          const sortOrder = codeRows.findIndex(([c]) => c === code) + 1;
          await manager.getRepository(CommonCodeEntity).save({
            code,
            group_code: group,
            name,
            remark,
            sort_order: sortOrder,
            use_yn: 'Y',
            depth: 1,
            created_by: CommonCodeSeeder.SYSTEM_USER,
          });
        }
      }
    });
  }
}
