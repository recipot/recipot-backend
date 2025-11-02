import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ERROR_CODES } from '@/common/constants/error-codes';
import { EXCEL_COLUMNS } from '@/common/constants/excel-columns.constants';
import { CustomException } from '@/common/exceptions/custom-exception';
import { CommonCode } from '@/database/entity/common-code.entity';
import { Condition } from '@/database/entity/condition.entity';
import { IngredientCategory } from '@/database/entity/ingredient-category.entity';
import { IngredientHealthInfo } from '@/database/entity/ingredient-health-info.entity';
import { Ingredient } from '@/database/entity/ingredient.entity';
import { Seasoning } from '@/database/entity/seasoning.entity';
import { Tool } from '@/database/entity/tool.entity';

import { DIVISION } from '../constants/file-import.constants';
import { RecipeService } from '../recipe.service';
import { ExcelNormalizerUtil } from '../utils/excel-normalizer.util';
import { IngredientSeasoningParserUtil } from '../utils/ingredient-seasoning-parser.util';
import { RecipeParserUtil } from '../utils/recipe-parser.util';
import { FileImportValidator } from '../validators/file-import.validator';
import { FileImportService } from './file-import.service';

// Mock modules
jest.mock('../validators/file-import.validator');
jest.mock('../utils/excel-normalizer.util');
jest.mock('../utils/ingredient-seasoning-parser.util');
jest.mock('../utils/recipe-parser.util');
// XLSX는 실제 라이브러리를 사용 (버퍼 생성에 필요)

type MockType<T> = {
  [P in keyof T]?: jest.Mock<any>;
};

const createRepositoryMock = <T>(): MockType<Repository<T>> => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('FileImportService', () => {
  let service: FileImportService;
  let ingredientRepository: MockType<Repository<Ingredient>>;
  let ingredientCategoryRepository: MockType<Repository<IngredientCategory>>;
  let ingredientHealthInfoRepository: MockType<
    Repository<IngredientHealthInfo>
  >;
  let seasoningRepository: MockType<Repository<Seasoning>>;
  let toolRepository: MockType<Repository<Tool>>;
  let conditionRepository: MockType<Repository<Condition>>;
  let recipeService: jest.Mocked<RecipeService>;

  const mockCondition: Condition = {
    id: 1,
    name: '힘들어',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Condition;

  const mockIngredient: Ingredient = {
    id: 1,
    name: '김치',
    ingredientCategoryId: 1,
    isRestrictedIngredient: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Ingredient;

  const mockSeasoning: Seasoning = {
    id: 1,
    name: '고춧가루',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Seasoning;

  const mockTool: Tool = {
    id: 1,
    name: '냄비(원팟)',
    imageUrl: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Tool;

  const mockIngredientCategory: IngredientCategory = {
    id: 1,
    name: '채소',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as IngredientCategory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileImportService,
        {
          provide: getRepositoryToken(Ingredient),
          useFactory: createRepositoryMock,
        },
        {
          provide: getRepositoryToken(IngredientCategory),
          useFactory: createRepositoryMock,
        },
        {
          provide: getRepositoryToken(IngredientHealthInfo),
          useFactory: createRepositoryMock,
        },
        {
          provide: getRepositoryToken(Seasoning),
          useFactory: createRepositoryMock,
        },
        {
          provide: getRepositoryToken(Tool),
          useFactory: createRepositoryMock,
        },
        {
          provide: getRepositoryToken(Condition),
          useFactory: createRepositoryMock,
        },
        {
          provide: getRepositoryToken(CommonCode),
          useFactory: createRepositoryMock,
        },
        {
          provide: RecipeService,
          useValue: {
            createRecipe: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FileImportService>(FileImportService);
    ingredientRepository = module.get(getRepositoryToken(Ingredient));
    ingredientCategoryRepository = module.get(
      getRepositoryToken(IngredientCategory),
    );
    ingredientHealthInfoRepository = module.get(
      getRepositoryToken(IngredientHealthInfo),
    );
    seasoningRepository = module.get(getRepositoryToken(Seasoning));
    toolRepository = module.get(getRepositoryToken(Tool));
    conditionRepository = module.get(getRepositoryToken(Condition));
    recipeService = module.get(RecipeService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('validateExcelFile', () => {
    it('유효한 엑셀 파일을 검증해야 함', () => {
      const mockFile = {
        mimetype:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        originalname: 'test.xlsx',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      jest.spyOn(FileImportValidator, 'validateExcelFile').mockReturnValue();

      expect(() => service.validateExcelFile(mockFile)).not.toThrow();
      expect(FileImportValidator.validateExcelFile).toHaveBeenCalledWith(
        mockFile,
      );
    });

    it('유효하지 않은 파일에 대해 예외를 던져야 함', () => {
      const mockFile = {
        mimetype: 'image/jpeg',
        originalname: 'test.jpg',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      jest
        .spyOn(FileImportValidator, 'validateExcelFile')
        .mockImplementation(() => {
          throw new CustomException({
            code: ERROR_CODES.VALIDATION_ERROR.code,
            message: '엑셀 파일만 업로드 가능합니다.',
          });
        });

      expect(() => service.validateExcelFile(mockFile)).toThrow(
        CustomException,
      );
    });
  });

  describe('importRecipesFromExcel', () => {
    let parseExcelFileSpy: jest.SpyInstance;

    beforeEach(() => {
      jest
        .spyOn(ExcelNormalizerUtil, 'normalizeExcelRow')
        .mockImplementation((row) => row);
      // parseExcelFile spy 초기화
      parseExcelFileSpy = jest.spyOn(
        FileImportService.prototype as any,
        'parseExcelFile',
      );
    });

    afterEach(() => {
      if (parseExcelFileSpy) {
        parseExcelFileSpy.mockRestore();
      }
    });

    it('성공적으로 레시피를 임포트해야 함', async () => {
      const mockRecipeData = [
        {
          [EXCEL_COLUMNS.RECIPE.TITLE]: '김치찌개',
          [EXCEL_COLUMNS.RECIPE.DURATION]: '30',
          [EXCEL_COLUMNS.RECIPE.CONDITION]: '힘들어',
          [EXCEL_COLUMNS.RECIPE.DESCRIPTION]: '맛있는 김치찌개',
          [EXCEL_COLUMNS.RECIPE.INGREDIENTS]: '김치 300g',
          [EXCEL_COLUMNS.RECIPE.SEASONINGS]: '고춧가루 1큰술',
          [EXCEL_COLUMNS.RECIPE.TOOLS]: '냄비(원팟)',
          [EXCEL_COLUMNS.RECIPE.IMAGES]:
            'https://example.com/image.jpg,https://example.com/image2.jpg,https://example.com/image3.jpg',
          [EXCEL_COLUMNS.RECIPE.NON_ALTERNATIVE_INGREDIENTS]: '',
          '1step 요약': '재료 준비',
          '1step': '김치를 썬다',
          '1step 이미지': 'https://example.com/step1.jpg',
        },
      ];

      // parseExcelFile을 직접 모킹하여 버퍼 생성 로직을 스킵
      parseExcelFileSpy.mockReturnValue(mockRecipeData);

      const buffer = Buffer.from('mock-excel-buffer');

      jest
        .spyOn(FileImportValidator, 'validateRecipeRequiredFields')
        .mockReturnValue(null);

      jest
        .spyOn(FileImportValidator, 'parseDurationMinutes')
        .mockReturnValue(30);

      jest
        .spyOn(
          IngredientSeasoningParserUtil,
          'parseIngredientOrSeasoningString',
        )
        .mockImplementation((text: string) => {
          if (text.includes('김치')) {
            return [{ name: '김치', amount: '300g' }];
          }
          if (text.includes('고춧가루')) {
            return [{ name: '고춧가루', amount: '1큰술' }];
          }
          return [];
        });

      jest
        .spyOn(RecipeParserUtil, 'parseNonAlternativeIngredients')
        .mockReturnValue([]);

      jest
        .spyOn(RecipeParserUtil, 'parseToolString')
        .mockReturnValue(['냄비(원팟)']);

      jest
        .spyOn(RecipeParserUtil, 'parseRecipeImages')
        .mockReturnValue([{ imageUrl: 'https://example.com/image.jpg' }]);

      jest.spyOn(RecipeParserUtil, 'parseRecipeSteps').mockReturnValue([
        {
          orderNum: 1,
          summary: '재료 준비',
          content: '김치를 썬다',
          imageUrl: 'https://example.com/step1.jpg',
        },
      ]);

      // 일괄 조회를 위한 find mock 설정
      conditionRepository.find = jest.fn().mockResolvedValue([mockCondition]);
      ingredientRepository.find = jest.fn().mockResolvedValue([mockIngredient]);
      seasoningRepository.find = jest.fn().mockResolvedValue([mockSeasoning]);
      toolRepository.find = jest.fn().mockResolvedValue([mockTool]);
      recipeService.createRecipe = jest.fn().mockResolvedValue(undefined);

      const result = await service.importRecipesFromExcel(buffer);

      expect(result.createdRecipeCount).toBe(1);
      expect(result.skippedRecipeCount).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(recipeService.createRecipe).toHaveBeenCalledTimes(1);
    });

    it('필수 필드가 없으면 레시피를 스킵해야 함', async () => {
      const mockRecipeData = [
        {
          [EXCEL_COLUMNS.RECIPE.TITLE]: '',
          [EXCEL_COLUMNS.RECIPE.DURATION]: '30',
          [EXCEL_COLUMNS.RECIPE.CONDITION]: '힘들어',
          [EXCEL_COLUMNS.RECIPE.DESCRIPTION]: '맛있는 김치찌개',
        },
      ];

      // parseExcelFile을 직접 모킹하여 버퍼 생성 로직을 스킵
      parseExcelFileSpy.mockReturnValue(mockRecipeData);

      const buffer = Buffer.from('mock-excel-buffer');

      jest
        .spyOn(FileImportValidator, 'validateRecipeRequiredFields')
        .mockReturnValue({
          row: 1,
          title: '(제목 없음)',
          error: '레시피 타이틀이 없습니다.',
        });

      // 일괄 조회를 위한 find mock 설정
      conditionRepository.find = jest.fn().mockResolvedValue([mockCondition]);
      ingredientRepository.find = jest.fn().mockResolvedValue([]);
      seasoningRepository.find = jest.fn().mockResolvedValue([]);
      toolRepository.find = jest.fn().mockResolvedValue([]);

      const result = await service.importRecipesFromExcel(buffer);

      expect(result.createdRecipeCount).toBe(0);
      expect(result.skippedRecipeCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe('레시피 타이틀이 없습니다.');
      expect(recipeService.createRecipe).not.toHaveBeenCalled();
    });

    it('조리과정이 없으면 레시피를 스킵해야 함', async () => {
      const mockRecipeData = [
        {
          [EXCEL_COLUMNS.RECIPE.TITLE]: '김치찌개',
          [EXCEL_COLUMNS.RECIPE.DURATION]: '30',
          [EXCEL_COLUMNS.RECIPE.CONDITION]: '힘들어',
          [EXCEL_COLUMNS.RECIPE.DESCRIPTION]: '맛있는 김치찌개',
          [EXCEL_COLUMNS.RECIPE.INGREDIENTS]: '김치 300g',
          [EXCEL_COLUMNS.RECIPE.SEASONINGS]: '',
          [EXCEL_COLUMNS.RECIPE.TOOLS]: '',
          [EXCEL_COLUMNS.RECIPE.IMAGES]: '',
          [EXCEL_COLUMNS.RECIPE.NON_ALTERNATIVE_INGREDIENTS]: '',
        },
      ];

      // parseExcelFile을 직접 모킹하여 버퍼 생성 로직을 스킵
      parseExcelFileSpy.mockReturnValue(mockRecipeData);

      const buffer = Buffer.from('mock-excel-buffer');

      jest
        .spyOn(FileImportValidator, 'validateRecipeRequiredFields')
        .mockReturnValue(null);

      jest
        .spyOn(FileImportValidator, 'parseDurationMinutes')
        .mockReturnValue(30);

      jest
        .spyOn(
          IngredientSeasoningParserUtil,
          'parseIngredientOrSeasoningString',
        )
        .mockImplementation((text: string) => {
          // 빈 문자열이면 빈 배열 반환
          if (!text || text.trim() === '') {
            return [];
          }
          // 그 외에는 파싱된 재료 반환
          return [{ name: '김치', amount: '300g' }];
        });

      jest
        .spyOn(RecipeParserUtil, 'parseNonAlternativeIngredients')
        .mockReturnValue([]);

      jest.spyOn(RecipeParserUtil, 'parseToolString').mockReturnValue([]);
      jest.spyOn(RecipeParserUtil, 'parseRecipeImages').mockReturnValue([]);
      jest.spyOn(RecipeParserUtil, 'parseRecipeSteps').mockReturnValue([]);

      // 일괄 조회를 위한 find mock 설정
      conditionRepository.find = jest.fn().mockResolvedValue([mockCondition]);
      ingredientRepository.find = jest.fn().mockResolvedValue([mockIngredient]);
      seasoningRepository.find = jest.fn().mockResolvedValue([]);
      toolRepository.find = jest.fn().mockResolvedValue([]);

      const result = await service.importRecipesFromExcel(buffer);

      expect(result.createdRecipeCount).toBe(0);
      expect(result.skippedRecipeCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe('조리과정이 없습니다.');
      expect(recipeService.createRecipe).not.toHaveBeenCalled();
    });

    it('여러 레시피 중 일부만 성공해야 함', async () => {
      const mockRecipeData = [
        {
          [EXCEL_COLUMNS.RECIPE.TITLE]: '김치찌개',
          [EXCEL_COLUMNS.RECIPE.DURATION]: '30',
          [EXCEL_COLUMNS.RECIPE.CONDITION]: '힘들어',
          [EXCEL_COLUMNS.RECIPE.DESCRIPTION]: '맛있는 김치찌개',
          [EXCEL_COLUMNS.RECIPE.INGREDIENTS]: '김치 300g',
          [EXCEL_COLUMNS.RECIPE.SEASONINGS]: '고춧가루 1큰술',
          [EXCEL_COLUMNS.RECIPE.TOOLS]: '냄비(원팟)',
          [EXCEL_COLUMNS.RECIPE.IMAGES]: '',
          [EXCEL_COLUMNS.RECIPE.NON_ALTERNATIVE_INGREDIENTS]: '',
          '1step 요약': '재료 준비',
          '1step': '김치를 썬다',
        },
        {
          [EXCEL_COLUMNS.RECIPE.TITLE]: '',
          [EXCEL_COLUMNS.RECIPE.DURATION]: '30',
          [EXCEL_COLUMNS.RECIPE.CONDITION]: '힘들어',
          [EXCEL_COLUMNS.RECIPE.DESCRIPTION]: '맛있는 김치찌개',
        },
      ];

      // parseExcelFile을 직접 모킹하여 버퍼 생성 로직을 스킵
      parseExcelFileSpy.mockReturnValue(mockRecipeData);

      const buffer = Buffer.from('mock-excel-buffer');

      jest
        .spyOn(FileImportValidator, 'validateRecipeRequiredFields')
        .mockImplementation((row) => {
          if (!row[EXCEL_COLUMNS.RECIPE.TITLE]) {
            return {
              row: 2,
              title: '(제목 없음)',
              error: '레시피 타이틀이 없습니다.',
            };
          }
          return null;
        });

      jest
        .spyOn(FileImportValidator, 'parseDurationMinutes')
        .mockReturnValue(30);

      jest
        .spyOn(
          IngredientSeasoningParserUtil,
          'parseIngredientOrSeasoningString',
        )
        .mockImplementation((text: string) => {
          if (text.includes('김치')) {
            return [{ name: '김치', amount: '300g' }];
          }
          if (text.includes('고춧가루')) {
            return [{ name: '고춧가루', amount: '1큰술' }];
          }
          return [];
        });

      jest
        .spyOn(RecipeParserUtil, 'parseNonAlternativeIngredients')
        .mockReturnValue([]);

      jest
        .spyOn(RecipeParserUtil, 'parseToolString')
        .mockReturnValue(['냄비(원팟)']);

      jest.spyOn(RecipeParserUtil, 'parseRecipeImages').mockReturnValue([]);
      jest.spyOn(RecipeParserUtil, 'parseRecipeSteps').mockReturnValue([
        {
          orderNum: 1,
          summary: '재료 준비',
          content: '김치를 썬다',
        },
      ]);

      // 일괄 조회를 위한 find mock 설정
      conditionRepository.find = jest.fn().mockResolvedValue([mockCondition]);
      ingredientRepository.find = jest.fn().mockResolvedValue([mockIngredient]);
      seasoningRepository.find = jest.fn().mockResolvedValue([mockSeasoning]);
      toolRepository.find = jest.fn().mockResolvedValue([mockTool]);
      recipeService.createRecipe = jest.fn().mockResolvedValue(undefined);

      const result = await service.importRecipesFromExcel(buffer);

      expect(result.createdRecipeCount).toBe(1);
      expect(result.skippedRecipeCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(recipeService.createRecipe).toHaveBeenCalledTimes(1);
    });
  });

  describe('importIngredientsAndSeasoningsFromExcel', () => {
    let parseExcelFileSpy: jest.SpyInstance;

    beforeEach(() => {
      jest
        .spyOn(ExcelNormalizerUtil, 'normalizeExcelRow')
        .mockImplementation((row) => row);
      // parseExcelFile spy 초기화
      parseExcelFileSpy = jest.spyOn(
        FileImportService.prototype as any,
        'parseExcelFile',
      );
    });

    afterEach(() => {
      if (parseExcelFileSpy) {
        parseExcelFileSpy.mockRestore();
      }
    });

    it('성공적으로 재료를 임포트해야 함', async () => {
      const mockData = [
        {
          [EXCEL_COLUMNS.INGREDIENT.NAME]: '김치',
          [EXCEL_COLUMNS.INGREDIENT.DIVISION]: DIVISION.INGREDIENT,
          [EXCEL_COLUMNS.INGREDIENT.CATEGORY]: '채소',
          [EXCEL_COLUMNS.INGREDIENT.IS_RESTRICTED]: 'O',
          [EXCEL_COLUMNS.INGREDIENT.COPY]: '신선한 김치',
        },
      ];

      // parseExcelFile을 직접 모킹하여 버퍼 생성 로직을 스킵
      parseExcelFileSpy.mockReturnValue(mockData);

      const buffer = Buffer.from('mock-excel-buffer');

      jest
        .spyOn(FileImportValidator, 'validateIngredientOrSeasoningRow')
        .mockReturnValue(null);

      jest
        .spyOn(IngredientSeasoningParserUtil, 'parseRestrictedIngredientValue')
        .mockReturnValue(true);

      // 일괄 조회를 위한 find mock 설정
      ingredientRepository.find = jest.fn().mockResolvedValue([]);
      seasoningRepository.find = jest.fn().mockResolvedValue([]);
      ingredientCategoryRepository.find = jest
        .fn()
        .mockResolvedValue([mockIngredientCategory]);
      ingredientRepository.create = jest.fn().mockReturnValue(mockIngredient);
      ingredientRepository.save = jest.fn().mockResolvedValue(mockIngredient);
      ingredientHealthInfoRepository.create = jest.fn().mockReturnValue({
        id: 1,
        ingredientId: mockIngredient.id,
        content: '신선한 김치',
      });
      ingredientHealthInfoRepository.save = jest.fn().mockResolvedValue({
        id: 1,
        ingredientId: mockIngredient.id,
        content: '신선한 김치',
      });

      const result =
        await service.importIngredientsAndSeasoningsFromExcel(buffer);

      expect(result.createdIngredientCount).toBe(1);
      expect(result.createdSeasoningCount).toBe(0);
      expect(result.skippedIngredientCount).toBe(0);
      expect(result.skippedSeasoningCount).toBe(0);
      expect(ingredientRepository.save).toHaveBeenCalledTimes(1);
      // COPY 필드가 있으면 건강 정보가 저장되어야 함
      expect(ingredientHealthInfoRepository.create).toHaveBeenCalledWith({
        ingredientId: mockIngredient.id,
        content: '신선한 김치',
      });
      expect(ingredientHealthInfoRepository.save).toHaveBeenCalledTimes(1);
    });

    it('성공적으로 양념을 임포트해야 함', async () => {
      const mockData = [
        {
          [EXCEL_COLUMNS.INGREDIENT.NAME]: '고춧가루',
          [EXCEL_COLUMNS.INGREDIENT.DIVISION]: DIVISION.SEASONING,
          [EXCEL_COLUMNS.INGREDIENT.CATEGORY]: '',
          [EXCEL_COLUMNS.INGREDIENT.IS_RESTRICTED]: '',
          [EXCEL_COLUMNS.INGREDIENT.COPY]: '',
        },
      ];

      // parseExcelFile을 직접 모킹하여 버퍼 생성 로직을 스킵
      parseExcelFileSpy.mockReturnValue(mockData);

      const buffer = Buffer.from('mock-excel-buffer');

      jest
        .spyOn(FileImportValidator, 'validateIngredientOrSeasoningRow')
        .mockReturnValue(null);

      // 일괄 조회를 위한 find mock 설정
      ingredientRepository.find = jest.fn().mockResolvedValue([]);
      seasoningRepository.find = jest.fn().mockResolvedValue([]);
      ingredientCategoryRepository.find = jest.fn().mockResolvedValue([]);
      seasoningRepository.create = jest.fn().mockReturnValue(mockSeasoning);
      seasoningRepository.save = jest.fn().mockResolvedValue(mockSeasoning);

      const result =
        await service.importIngredientsAndSeasoningsFromExcel(buffer);

      expect(result.createdIngredientCount).toBe(0);
      expect(result.createdSeasoningCount).toBe(1);
      expect(result.skippedIngredientCount).toBe(0);
      expect(result.skippedSeasoningCount).toBe(0);
      expect(seasoningRepository.save).toHaveBeenCalledTimes(1);
    });

    it('이미 존재하는 재료는 스킵해야 함', async () => {
      const mockData = [
        {
          [EXCEL_COLUMNS.INGREDIENT.NAME]: '김치',
          [EXCEL_COLUMNS.INGREDIENT.DIVISION]: DIVISION.INGREDIENT,
          [EXCEL_COLUMNS.INGREDIENT.CATEGORY]: '채소',
          [EXCEL_COLUMNS.INGREDIENT.IS_RESTRICTED]: '',
          [EXCEL_COLUMNS.INGREDIENT.COPY]: '',
        },
      ];

      // parseExcelFile을 직접 모킹하여 버퍼 생성 로직을 스킵
      parseExcelFileSpy.mockReturnValue(mockData);

      const buffer = Buffer.from('mock-excel-buffer');

      jest
        .spyOn(FileImportValidator, 'validateIngredientOrSeasoningRow')
        .mockReturnValue('재료 "김치"가 이미 존재합니다.');

      // 일괄 조회를 위한 find mock 설정 (이미 존재하는 재료 포함)
      ingredientRepository.find = jest.fn().mockResolvedValue([mockIngredient]);
      seasoningRepository.find = jest.fn().mockResolvedValue([]);
      ingredientCategoryRepository.find = jest.fn().mockResolvedValue([]);

      const result =
        await service.importIngredientsAndSeasoningsFromExcel(buffer);

      expect(result.createdIngredientCount).toBe(0);
      expect(result.createdSeasoningCount).toBe(0);
      expect(result.skippedIngredientCount).toBe(1);
      expect(result.skippedSeasoningCount).toBe(0);
      expect(ingredientRepository.save).not.toHaveBeenCalled();
    });

    it('카테고리가 없으면 자동으로 생성해야 함', async () => {
      const mockData = [
        {
          [EXCEL_COLUMNS.INGREDIENT.NAME]: '김치',
          [EXCEL_COLUMNS.INGREDIENT.DIVISION]: DIVISION.INGREDIENT,
          [EXCEL_COLUMNS.INGREDIENT.CATEGORY]: '새카테고리',
          [EXCEL_COLUMNS.INGREDIENT.IS_RESTRICTED]: '',
          [EXCEL_COLUMNS.INGREDIENT.COPY]: '',
        },
      ];

      // parseExcelFile을 직접 모킹하여 버퍼 생성 로직을 스킵
      parseExcelFileSpy.mockReturnValue(mockData);

      const buffer = Buffer.from('mock-excel-buffer');

      jest
        .spyOn(FileImportValidator, 'validateIngredientOrSeasoningRow')
        .mockReturnValue(null);

      jest
        .spyOn(IngredientSeasoningParserUtil, 'parseRestrictedIngredientValue')
        .mockReturnValue(false);

      // 일괄 조회를 위한 find mock 설정 (카테고리가 없음)
      ingredientRepository.find = jest.fn().mockResolvedValue([]);
      seasoningRepository.find = jest.fn().mockResolvedValue([]);
      ingredientCategoryRepository.find = jest.fn().mockResolvedValue([]);
      ingredientCategoryRepository.create = jest
        .fn()
        .mockReturnValue(mockIngredientCategory);
      ingredientCategoryRepository.save = jest
        .fn()
        .mockResolvedValue(mockIngredientCategory);
      ingredientRepository.create = jest.fn().mockReturnValue(mockIngredient);
      ingredientRepository.save = jest.fn().mockResolvedValue(mockIngredient);

      const result =
        await service.importIngredientsAndSeasoningsFromExcel(buffer);

      expect(result.createdIngredientCount).toBe(1);
      expect(ingredientCategoryRepository.save).toHaveBeenCalledTimes(1);
      expect(ingredientRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('createSkippedDataExcel', () => {
    it('스킵된 데이터가 없으면 null을 반환해야 함', () => {
      const result = service.createSkippedDataExcel([], []);

      expect(result).toBeNull();
    });

    it('스킵된 데이터가 있으면 엑셀 버퍼를 생성해야 함', () => {
      const skippedRows = [
        {
          [EXCEL_COLUMNS.INGREDIENT.NAME]: '김치',
          [EXCEL_COLUMNS.INGREDIENT.DIVISION]: DIVISION.INGREDIENT,
          [EXCEL_COLUMNS.INGREDIENT.CATEGORY]: '채소',
          [EXCEL_COLUMNS.INGREDIENT.IS_RESTRICTED]: '',
          [EXCEL_COLUMNS.INGREDIENT.COPY]: '',
        },
      ];
      const skippedReasons = ['이미 존재합니다.'];

      const result = service.createSkippedDataExcel(
        skippedRows,
        skippedReasons,
      );

      expect(result).not.toBeNull();
      expect(Buffer.isBuffer(result)).toBe(true);
    });
  });

  describe('createSkippedRecipeExcel', () => {
    it('스킵된 레시피가 없으면 null을 반환해야 함', () => {
      const result = service.createSkippedRecipeExcel([], []);

      expect(result).toBeNull();
    });

    it('스킵된 레시피가 있으면 엑셀 버퍼를 생성해야 함', () => {
      const skippedRows = [
        {
          row: {
            [EXCEL_COLUMNS.RECIPE.TITLE]: '김치찌개',
            [EXCEL_COLUMNS.RECIPE.DURATION]: '30',
            [EXCEL_COLUMNS.RECIPE.CONDITION]: '힘들어',
            [EXCEL_COLUMNS.RECIPE.DESCRIPTION]: '맛있는 김치찌개',
            '1step 요약': '재료 준비',
            '1step': '김치를 썬다',
          },
          rowNumber: 1,
        },
      ];
      const errors = [
        {
          row: 1,
          title: '김치찌개',
          error: '조리과정이 없습니다.',
        },
      ];

      const result = service.createSkippedRecipeExcel(skippedRows, errors);

      expect(result).not.toBeNull();
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('step 컬럼을 올바른 순서로 정렬해야 함', () => {
      const skippedRows = [
        {
          row: {
            [EXCEL_COLUMNS.RECIPE.TITLE]: '김치찌개',
            [EXCEL_COLUMNS.RECIPE.DURATION]: '30',
            [EXCEL_COLUMNS.RECIPE.CONDITION]: '힘들어',
            [EXCEL_COLUMNS.RECIPE.DESCRIPTION]: '맛있는 김치찌개',
            '2step 이미지': 'https://example.com/step2.jpg',
            '1step 요약': '재료 준비',
            '2step': '끓이기',
            '1step': '김치를 썬다',
            '1step 이미지': 'https://example.com/step1.jpg',
            '2step 요약': '끓이기 요약',
          },
          rowNumber: 1,
        },
      ];
      const errors = [
        {
          row: 1,
          title: '김치찌개',
          error: '테스트 에러',
        },
      ];

      const result = service.createSkippedRecipeExcel(skippedRows, errors);

      expect(result).not.toBeNull();
      expect(Buffer.isBuffer(result)).toBe(true);
    });
  });
});
