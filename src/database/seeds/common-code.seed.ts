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
        code_name: 'PAID',
        group_name: '유저 역할',
        depth: 1,
        order_num: 2,
        is_active: true,
      },
      {
        group_code: 'U01',
        group_code_name: 'USER_ROLE',
        code: 'U01003',
        code_name: 'GENERAL',
        group_name: '유저 역할',
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
