import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ERROR_CODES } from '@/common/constants/error-codes';
import { CustomException } from '@/common/exceptions/custom-exception';
import { CommonCode } from '@/database/entity/common-code.entity';
import { UserCompletedRecipe } from '@/database/entity/user-completed-recipe.entity';
import { UserHealthSurveyEffect } from '@/database/entity/user-health-survey-effect.entity';
import { UserHealthSurvey } from '@/database/entity/user-health-survey.entity';
import { HEALTH_SURVEY_CONSTANTS } from './constants/health-survey.constants';
import { HealthSurveyService } from './health-survey.service';

describe('HealthSurveyService', () => {
  let service: HealthSurveyService;
  let userCompletedRecipeRepository: jest.Mocked<
    Repository<UserCompletedRecipe>
  >;
  let userHealthSurveyRepository: jest.Mocked<Repository<UserHealthSurvey>>;
  let userHealthSurveyEffectRepository: jest.Mocked<
    Repository<UserHealthSurveyEffect>
  >;
  let commonCodeRepository: jest.Mocked<Repository<CommonCode>>;

  const mockUserCompletedRecipeRepository = {
    count: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUserHealthSurveyRepository = {
    exist: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUserHealthSurveyEffectRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockCommonCodeRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthSurveyService,
        {
          provide: getRepositoryToken(UserCompletedRecipe),
          useValue: mockUserCompletedRecipeRepository,
        },
        {
          provide: getRepositoryToken(UserHealthSurvey),
          useValue: mockUserHealthSurveyRepository,
        },
        {
          provide: getRepositoryToken(UserHealthSurveyEffect),
          useValue: mockUserHealthSurveyEffectRepository,
        },
        {
          provide: getRepositoryToken(CommonCode),
          useValue: mockCommonCodeRepository,
        },
      ],
    }).compile();

    service = module.get<HealthSurveyService>(HealthSurveyService);
    userCompletedRecipeRepository = module.get(
      getRepositoryToken(UserCompletedRecipe),
    );
    userHealthSurveyRepository = module.get(
      getRepositoryToken(UserHealthSurvey),
    );
    userHealthSurveyEffectRepository = module.get(
      getRepositoryToken(UserHealthSurveyEffect),
    );
    commonCodeRepository = module.get(getRepositoryToken(CommonCode));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getEligibility', () => {
    const userId = 1;

    it('레시피 완료 이력이 있고 이번 주 설문 제출 이력이 없으면 작성 가능해야 한다', async () => {
      userCompletedRecipeRepository.count.mockResolvedValue(2);
      userHealthSurveyRepository.exist.mockResolvedValue(false);

      const result = await service.getEligibility(userId);

      expect(result.isEligible).toBe(true);
      expect(result.recentCompletionCount).toBe(2);
    });

    it('레시피 완료 이력이 없으면 작성 불가능해야 한다', async () => {
      userCompletedRecipeRepository.count.mockResolvedValue(0);
      userHealthSurveyRepository.exist.mockResolvedValue(false);

      const result = await service.getEligibility(userId);

      expect(result.isEligible).toBe(false);
      expect(result.recentCompletionCount).toBe(0);
    });

    it('이번 주 설문 제출 이력이 있으면 작성 불가능해야 한다', async () => {
      userCompletedRecipeRepository.count.mockResolvedValue(2);
      userHealthSurveyRepository.exist.mockResolvedValue(true);

      const result = await service.getEligibility(userId);

      expect(result.isEligible).toBe(false);
      expect(result.recentCompletionCount).toBe(2);
    });
  });

  describe('getPreparationData', () => {
    it('건강 설문 준비 데이터를 반환해야 한다', async () => {
      const mockPersistentIssueCodes: CommonCode[] = [
        {
          id: 1,
          groupCode: 'H01',
          code: 'H01002',
          codeName: '전과 비슷해요.',
          groupCodeName: 'HEALTH_PERSISTENT_ISSUE',
          groupName: '평소 겪던 건강 문제',
          orderNum: 2,
          isActive: true,
          depth: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as CommonCode,
        {
          id: 2,
          groupCode: 'H01',
          code: 'H01003',
          codeName: '개선됨을 느껴요.',
          groupCodeName: 'HEALTH_PERSISTENT_ISSUE',
          groupName: '평소 겪던 건강 문제',
          orderNum: 3,
          isActive: true,
          depth: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as CommonCode,
      ];

      const mockEffectCodes: CommonCode[] = [
        {
          id: 3,
          groupCode: 'H02',
          code: 'H02001',
          codeName: '피로가 줄었다.',
          groupCodeName: 'HEALTH_PERCEIVED_EFFECT',
          groupName: '느낀 변화',
          orderNum: 1,
          isActive: true,
          depth: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as CommonCode,
        {
          id: 4,
          groupCode: 'H02',
          code: 'H02004',
          codeName: '체중 관리에 도움이 된다.',
          groupCodeName: 'HEALTH_PERCEIVED_EFFECT',
          groupName: '느낀 변화',
          orderNum: 4,
          isActive: true,
          depth: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as CommonCode,
      ];

      commonCodeRepository.find
        .mockResolvedValueOnce(mockPersistentIssueCodes)
        .mockResolvedValueOnce(mockEffectCodes);

      const result = await service.getPreparationData();

      expect(result.persistentIssueOption).toHaveLength(2);
      expect(result.persistentIssueOption[0]).toEqual({
        code: 'H01002',
        codeName: '전과 비슷해요.',
      });
      expect(result.effectOptions).toHaveLength(2);
      expect(result.effectOptions[0]).toEqual({
        code: 'H02001',
        codeName: '피로가 줄었다.',
      });
    });
  });

  describe('submitHealthSurvey', () => {
    const userId = 1;

    beforeEach(() => {
      // getEligibility를 위한 기본 mock 설정
      userCompletedRecipeRepository.count.mockResolvedValue(2);
      userHealthSurveyRepository.exist.mockResolvedValue(false);
    });

    it('일반 코드와 effectCodes가 있을 때 에러를 발생시켜야 한다', async () => {
      const dto = {
        persistentIssueCode: 'H01002',
        effectCodes: ['H02001', 'H02004'],
        additionalNote: '테스트 노트',
      };

      const mockPersistentIssueCode: CommonCode = {
        id: 1,
        groupCode: 'H01',
        code: 'H01002',
        codeName: '전과 비슷해요.',
        isActive: true,
      } as CommonCode;

      commonCodeRepository.findOne.mockResolvedValue(mockPersistentIssueCode);

      await expect(service.submitHealthSurvey(userId, dto)).rejects.toThrow(
        CustomException,
      );

      await expect(service.submitHealthSurvey(userId, dto)).rejects.toThrow(
        ERROR_CODES.HEALTH_SURVEY_EFFECT_CODES_NOT_ALLOWED.message,
      );

      expect(userHealthSurveyRepository.save).not.toHaveBeenCalled();
    });

    it('일반 코드와 effectCodes가 빈 배열일 때 성공해야 한다', async () => {
      const dto = {
        persistentIssueCode: 'H01002',
        effectCodes: [],
        additionalNote: null,
      };

      const mockPersistentIssueCode: CommonCode = {
        id: 1,
        groupCode: 'H01',
        code: 'H01002',
        codeName: '전과 비슷해요.',
        isActive: true,
      } as CommonCode;

      const mockSavedSurvey: UserHealthSurvey = {
        id: 1,
        userId,
        persistentIssueCode: dto.persistentIssueCode,
        additionalNote: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as UserHealthSurvey;

      commonCodeRepository.findOne.mockResolvedValue(mockPersistentIssueCode);
      commonCodeRepository.find.mockResolvedValue([]);
      userHealthSurveyRepository.create.mockReturnValue({
        userId,
        persistentIssueCode: dto.persistentIssueCode,
        additionalNote: null,
      } as UserHealthSurvey);
      userHealthSurveyRepository.save.mockResolvedValue(mockSavedSurvey);

      const result = await service.submitHealthSurvey(userId, dto);

      expect(result.surveyId).toBe(1);
      expect(userHealthSurveyRepository.save).toHaveBeenCalled();
      expect(userHealthSurveyEffectRepository.save).not.toHaveBeenCalled();
    });

    it('H01003 코드와 effectCodes가 있을 때 성공해야 한다', async () => {
      const dto = {
        persistentIssueCode: 'H01003',
        effectCodes: ['H02001'],
        additionalNote: null,
      };

      const mockPersistentIssueCode: CommonCode = {
        id: 1,
        groupCode: 'H01',
        code: 'H01003',
        codeName: '개선됨을 느껴요.',
        isActive: true,
      } as CommonCode;

      const mockEffectCodes: CommonCode[] = [
        {
          id: 2,
          groupCode: 'H02',
          code: 'H02001',
          codeName: '피로가 줄었다.',
          isActive: true,
        } as CommonCode,
      ];

      const mockSavedSurvey: UserHealthSurvey = {
        id: 1,
        userId,
        persistentIssueCode: dto.persistentIssueCode,
        additionalNote: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as UserHealthSurvey;

      commonCodeRepository.findOne.mockResolvedValue(mockPersistentIssueCode);
      commonCodeRepository.find.mockResolvedValue(mockEffectCodes);
      userHealthSurveyRepository.create.mockReturnValue({
        userId,
        persistentIssueCode: dto.persistentIssueCode,
        additionalNote: null,
      } as UserHealthSurvey);
      userHealthSurveyRepository.save.mockResolvedValue(mockSavedSurvey);
      userHealthSurveyEffectRepository.create.mockReturnValue({
        userHealthSurveyId: 1,
        effectCode: 'H02001',
      } as UserHealthSurveyEffect);
      userHealthSurveyEffectRepository.save.mockResolvedValue([
        {
          id: 1,
          userHealthSurveyId: 1,
          effectCode: 'H02001',
        } as UserHealthSurveyEffect,
      ] as any);

      const result = await service.submitHealthSurvey(userId, dto);

      expect(result.surveyId).toBe(1);
      expect(userHealthSurveyRepository.save).toHaveBeenCalled();
      expect(userHealthSurveyEffectRepository.save).toHaveBeenCalled();
    });

    it('H01003 코드와 effectCodes가 빈 배열일 때 에러를 발생시켜야 한다', async () => {
      const dto = {
        persistentIssueCode: 'H01003',
        effectCodes: [],
        additionalNote: null,
      };

      const mockPersistentIssueCode: CommonCode = {
        id: 1,
        groupCode: 'H01',
        code: 'H01003',
        codeName: '개선됨을 느껴요.',
        isActive: true,
      } as CommonCode;

      commonCodeRepository.findOne.mockResolvedValue(mockPersistentIssueCode);

      await expect(service.submitHealthSurvey(userId, dto)).rejects.toThrow(
        CustomException,
      );

      await expect(service.submitHealthSurvey(userId, dto)).rejects.toThrow(
        ERROR_CODES.HEALTH_SURVEY_EFFECT_CODES_REQUIRED.message,
      );

      expect(userHealthSurveyRepository.save).not.toHaveBeenCalled();
    });

    it('작성 자격이 없으면 에러를 발생시켜야 한다', async () => {
      const dto = {
        persistentIssueCode: 'H01002',
        effectCodes: [],
        additionalNote: null,
      };

      userCompletedRecipeRepository.count.mockResolvedValue(0);
      userHealthSurveyRepository.exist.mockResolvedValue(false);

      await expect(service.submitHealthSurvey(userId, dto)).rejects.toThrow(
        CustomException,
      );

      await expect(service.submitHealthSurvey(userId, dto)).rejects.toThrow(
        ERROR_CODES.HEALTH_SURVEY_NOT_ELIGIBLE.message,
      );
    });

    it('잘못된 persistentIssueCode일 때 에러를 발생시켜야 한다', async () => {
      const dto = {
        persistentIssueCode: 'INVALID_CODE',
        effectCodes: [],
        additionalNote: null,
      };

      commonCodeRepository.findOne.mockResolvedValue(null);

      await expect(service.submitHealthSurvey(userId, dto)).rejects.toThrow(
        CustomException,
      );

      await expect(service.submitHealthSurvey(userId, dto)).rejects.toThrow(
        ERROR_CODES.COMMON_CODE_NOT_FOUND.message,
      );
    });

    it('잘못된 effectCodes일 때 에러를 발생시켜야 한다', async () => {
      const dto = {
        persistentIssueCode: 'H01003',
        effectCodes: ['H02001', 'INVALID_EFFECT'],
        additionalNote: null,
      };

      const mockPersistentIssueCode: CommonCode = {
        id: 1,
        groupCode: 'H01',
        code: 'H01003',
        codeName: '개선됨을 느껴요.',
        isActive: true,
      } as CommonCode;

      const mockEffectCodes: CommonCode[] = [
        {
          id: 2,
          groupCode: 'H02',
          code: 'H02001',
          codeName: '피로가 줄었다.',
          isActive: true,
        } as CommonCode,
      ];

      commonCodeRepository.findOne.mockResolvedValue(mockPersistentIssueCode);
      commonCodeRepository.find.mockResolvedValue(mockEffectCodes);

      await expect(service.submitHealthSurvey(userId, dto)).rejects.toThrow(
        CustomException,
      );

      await expect(service.submitHealthSurvey(userId, dto)).rejects.toThrow(
        ERROR_CODES.COMMON_CODE_NOT_FOUND.message,
      );
    });

    it('REQUIRES_EFFECT_CODES에 포함된 다른 코드도 effectCodes가 필수여야 한다', async () => {
      // 상수에 다른 코드가 추가될 경우를 대비한 테스트
      const testCode = HEALTH_SURVEY_CONSTANTS.REQUIRES_EFFECT_CODES[0];
      const dto = {
        persistentIssueCode: testCode,
        effectCodes: [],
        additionalNote: null,
      };

      const mockPersistentIssueCode: CommonCode = {
        id: 1,
        groupCode: 'H01',
        code: testCode,
        codeName: '테스트 코드',
        isActive: true,
      } as CommonCode;

      commonCodeRepository.findOne.mockResolvedValue(mockPersistentIssueCode);

      await expect(service.submitHealthSurvey(userId, dto)).rejects.toThrow(
        CustomException,
      );

      await expect(service.submitHealthSurvey(userId, dto)).rejects.toThrow(
        ERROR_CODES.HEALTH_SURVEY_EFFECT_CODES_REQUIRED.message,
      );
    });

    it('H01003이 아닌 코드에 effectCodes가 있으면 에러를 발생시켜야 한다', async () => {
      const dto = {
        persistentIssueCode: 'H01002',
        effectCodes: ['H02001'],
        additionalNote: null,
      };

      const mockPersistentIssueCode: CommonCode = {
        id: 1,
        groupCode: 'H01',
        code: 'H01002',
        codeName: '전과 비슷해요.',
        isActive: true,
      } as CommonCode;

      commonCodeRepository.findOne.mockResolvedValue(mockPersistentIssueCode);

      await expect(service.submitHealthSurvey(userId, dto)).rejects.toThrow(
        CustomException,
      );

      await expect(service.submitHealthSurvey(userId, dto)).rejects.toThrow(
        ERROR_CODES.HEALTH_SURVEY_EFFECT_CODES_NOT_ALLOWED.message,
      );

      expect(userHealthSurveyRepository.save).not.toHaveBeenCalled();
    });
  });
});
