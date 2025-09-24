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
        groupCode: 'C01',
        groupCodeName: 'PLATFORM',
        code: 'C01001',
        codeName: 'kakao',
        groupName: '플랫폼',
        depth: 1,
        orderNum: 1,
        isActive: true,
      },
      {
        groupCode: 'C01',
        groupCodeName: 'PLATFORM',
        code: 'C01002',
        codeName: 'google',
        groupName: '플랫폼',
        depth: 1,
        orderNum: 2,
        isActive: true,
      },
      {
        groupCode: 'U01',
        groupCodeName: 'USER_ROLE',
        code: 'U01001',
        codeName: 'admin',
        groupName: '유저 역할',
        depth: 1,
        orderNum: 1,
        isActive: true,
      },
      {
        groupCode: 'U01',
        groupCodeName: 'USER_ROLE',
        code: 'U01002',
        codeName: 'paid',
        groupName: '유저 역할',
        depth: 1,
        orderNum: 2,
        isActive: true,
      },
      {
        groupCode: 'U01',
        groupCodeName: 'USER_ROLE',
        code: 'U01003',
        codeName: 'general',
        groupName: '유저 역할',
        depth: 1,
        orderNum: 3,
        isActive: true,
      },
      {
        groupCode: 'R01',
        groupCodeName: 'TIME_TAKEN',
        code: 'R01001',
        codeName: '5',
        groupName: '소요 시간',
        depth: 1,
        orderNum: 1,
        isActive: true,
      },
      {
        groupCode: 'R01',
        groupCodeName: 'TIME_TAKEN',
        code: 'R01002',
        codeName: '10',
        groupName: '소요 시간',
        depth: 1,
        orderNum: 2,
        isActive: true,
      },
      {
        groupCode: 'R01',
        groupCodeName: 'TIME_TAKEN',
        code: 'R01003',
        codeName: '15',
        groupName: '소요 시간',
        depth: 1,
        orderNum: 3,
        isActive: true,
      },
      {
        groupCode: 'R01',
        groupCodeName: 'TIME_TAKEN',
        code: 'R01004',
        codeName: '30',
        groupName: '소요 시간',
        depth: 1,
        orderNum: 4,
        isActive: true,
      },
      {
        groupCode: 'R02',
        groupCodeName: 'COOKING_DIFFICULTY',
        code: 'R02001',
        codeName: '초보',
        groupName: '조리 난이도',
        depth: 1,
        orderNum: 1,
        isActive: true,
      },
      {
        groupCode: 'R02',
        groupCodeName: 'COOKING_DIFFICULTY',
        code: 'R02002',
        codeName: '중수',
        groupName: '조리 난이도',
        depth: 1,
        orderNum: 2,
        isActive: true,
      },
      {
        groupCode: 'R02',
        groupCodeName: 'COOKING_DIFFICULTY',
        code: 'R02003',
        codeName: '고수',
        groupName: '조리 난이도',
        depth: 1,
        orderNum: 3,
        isActive: true,
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
