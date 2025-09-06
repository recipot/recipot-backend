import { DataSource } from 'typeorm';
import { CommonCode } from '../entity/common-code.entity';

export class CommonCodeSeed {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    if (!this.dataSource || !this.dataSource.manager) {
      throw new Error('DataSource or manager is not available');
    }

    const commonCodeRepository =
      this.dataSource.manager.getRepository(CommonCode);

    const commonCodes = [
      {
        group_code: 'C01',
        group_code_name: 'PLATFORM',
        code: 'C01001',
        code_name: 'kakao',
        group_name: '플랫폼',
        depth: 1,
        order_num: 1,
        is_active: true,
      },
      {
        group_code: 'C01',
        group_code_name: 'PLATFORM',
        code: 'C01002',
        code_name: 'google',
        group_name: '플랫폼',
        depth: 1,
        order_num: 2,
        is_active: true,
      },
      {
        group_code: 'U01',
        group_code_name: 'USER_ROLE',
        code: 'U01001',
        code_name: 'admin',
        group_name: '유저 역할',
        depth: 1,
        order_num: 1,
        is_active: true,
      },
      {
        group_code: 'U01',
        group_code_name: 'USER_ROLE',
        code: 'U01002',
        code_name: 'paid',
        group_name: '유저 역할',
        depth: 1,
        order_num: 2,
        is_active: true,
      },
      {
        group_code: 'U01',
        group_code_name: 'USER_ROLE',
        code: 'U01003',
        code_name: 'general',
        group_name: '유저 역할',
        depth: 1,
        order_num: 3,
        is_active: true,
      },
      {
        group_code: 'R01',
        group_code_name: 'TIME_TAKEN',
        code: 'R01001',
        code_name: '5',
        group_name: '소요 시간',
        depth: 1,
        order_num: 1,
        is_active: true,
      },
      {
        group_code: 'R01',
        group_code_name: 'TIME_TAKEN',
        code: 'R01002',
        code_name: '10',
        group_name: '소요 시간',
        depth: 1,
        order_num: 2,
        is_active: true,
      },
      {
        group_code: 'R01',
        group_code_name: 'TIME_TAKEN',
        code: 'R01003',
        code_name: '15',
        group_name: '소요 시간',
        depth: 1,
        order_num: 3,
        is_active: true,
      },
      {
        group_code: 'R01',
        group_code_name: 'TIME_TAKEN',
        code: 'R01004',
        code_name: '30',
        group_name: '소요 시간',
        depth: 1,
        order_num: 4,
        is_active: true,
      },
      {
        group_code: 'R02',
        group_code_name: 'COOKING_DIFFICULTY',
        code: 'R02001',
        code_name: '초보',
        group_name: '조리 난이도',
        depth: 1,
        order_num: 1,
        is_active: true,
      },
      {
        group_code: 'R02',
        group_code_name: 'COOKING_DIFFICULTY',
        code: 'R02002',
        code_name: '중수',
        group_name: '조리 난이도',
        depth: 1,
        order_num: 2,
        is_active: true,
      },
      {
        group_code: 'R02',
        group_code_name: 'COOKING_DIFFICULTY',
        code: 'R02003',
        code_name: '고수',
        group_name: '조리 난이도',
        depth: 1,
        order_num: 3,
        is_active: true,
      },
    ];

    for (const commonCodeData of commonCodes) {
      const existingCode = await commonCodeRepository.findOne({
        where: { code: commonCodeData.code },
      });

      if (!existingCode) {
        const commonCode = commonCodeRepository.create(commonCodeData);
        await commonCodeRepository.save(commonCode);
      }
    }
  }
}
