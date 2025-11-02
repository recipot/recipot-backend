import { ERROR_CODES } from '@/common/constants/error-codes';
import { CustomException } from '@/common/exceptions/custom-exception';
import { CommonCode } from '@/database/entity/common-code.entity';
import { Condition } from '@/database/entity/condition.entity';
import { IngredientCategory } from '@/database/entity/ingredient-category.entity';
import { Ingredient } from '@/database/entity/ingredient.entity';
import { Seasoning } from '@/database/entity/seasoning.entity';
import { Tool } from '@/database/entity/tool.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';

interface CsvIngredientRow {
  재료: string;
  구분: string;
  대분류: string;
  '못 먹는 재료 여부'?: string;
  '재료 한줄 카피': string;
}

@Injectable()
export class FileImportService {
  private readonly logger = new Logger(FileImportService.name);

  constructor(
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
    @InjectRepository(IngredientCategory)
    private readonly ingredientCategoryRepository: Repository<IngredientCategory>,
    @InjectRepository(Seasoning)
    private readonly seasoningRepository: Repository<Seasoning>,
    @InjectRepository(Tool)
    private readonly toolRepository: Repository<Tool>,
    @InjectRepository(Condition)
    private readonly conditionRepository: Repository<Condition>,
    @InjectRepository(CommonCode)
    private readonly commonCodeRepository: Repository<CommonCode>,
  ) {}

  /**
   * 이름으로 재료를 찾습니다.
   */
  private async findIngredientByName(name: string): Promise<Ingredient | null> {
    return await this.ingredientRepository.findOne({
      where: { name },
    });
  }

  /**
   * 이름으로 양념을 찾습니다.
   */
  private async findSeasoningByName(name: string): Promise<Seasoning | null> {
    return await this.seasoningRepository.findOne({
      where: { name },
    });
  }

  /**
   * 이름으로 조리도구를 찾습니다.
   */
  private async findToolByName(name: string): Promise<Tool | null> {
    return await this.toolRepository.findOne({
      where: { name },
    });
  }

  /**
   * 스킵된 데이터를 엑셀 파일로 변환합니다.
   */
  createSkippedDataExcel(
    skippedRows: CsvIngredientRow[],
    skippedReasons: string[],
  ): Buffer {
    if (skippedRows.length === 0) {
      return null;
    }

    // 스킵 이유를 포함한 데이터 준비
    const data = skippedRows.map((row, index) => ({
      재료: row.재료 || '',
      구분: row.구분 || '',
      대분류: row.대분류 || '',
      '못 먹는 재료 여부': row['못 먹는 재료 여부'] || '',
      '재료 한줄 카피': row['재료 한줄 카피'] || '',
      '스킵 이유': skippedReasons[index] || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '스킵된 데이터');

    // 버퍼로 변환
    return Buffer.from(
      XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }),
    );
  }

  /**
   * 엑셀 파일을 파싱하여 CsvIngredientRow 배열로 변환합니다.
   */
  private parseExcelFile(buffer: Buffer): CsvIngredientRow[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // 엑셀 데이터를 CsvIngredientRow 형식으로 변환
    return jsonData.map((row: any) => {
      const result: any = {};
      // 모든 키를 정규화 (공백 제거 등)
      Object.keys(row).forEach((key) => {
        const normalizedKey = key.trim();
        result[normalizedKey] = row[key];
      });
      return result as CsvIngredientRow;
    });
  }

  /**
   * 파일이 유효한 엑셀 파일인지 검증합니다.
   */
  validateExcelFile(file: Express.Multer.File): void {
    if (!file) {
      throw new CustomException({
        code: ERROR_CODES.VALIDATION_ERROR.code,
        message: '엑셀 파일이 필요합니다.',
      });
    }

    const isValidFile =
      file.mimetype.includes('spreadsheet') ||
      file.mimetype.includes('excel') ||
      file.originalname.endsWith('.xlsx') ||
      file.originalname.endsWith('.xls') ||
      file.originalname.endsWith('.xlsm');

    if (!isValidFile) {
      throw new CustomException({
        code: ERROR_CODES.VALIDATION_ERROR.code,
        message: '엑셀 파일만 업로드 가능합니다.',
      });
    }
  }

  /**
   * 엑셀 파일을 파싱하여 재료와 양념을 생성합니다.
   */
  async importIngredientsAndSeasoningsFromCsv(buffer: Buffer): Promise<{
    createdIngredientCount: number;
    createdSeasoningCount: number;
    skippedIngredientCount: number;
    skippedSeasoningCount: number;
    skippedExcelBuffer: Buffer | null;
    skippedFileName: string | null;
  }> {
    try {
      // 엑셀 파일 파싱
      const records: CsvIngredientRow[] = this.parseExcelFile(buffer);
      this.logger.log(
        `엑셀 파일에서 ${records.length}개의 재료/양념 데이터를 찾았습니다.`,
      );

      let createdIngredientCount = 0;
      let createdSeasoningCount = 0;
      let skippedIngredientCount = 0;
      let skippedSeasoningCount = 0;
      const skippedRows: CsvIngredientRow[] = [];
      const skippedReasons: string[] = [];

      // 각 행을 순차적으로 처리
      for (const [index, row] of records.entries()) {
        try {
          const name = row.재료?.trim();
          const division = row.구분?.trim(); // '식재료' or '양념'
          const categoryName = row.대분류?.trim();
          // "못 먹는 재료 여부" 컬럼에서 "O" 또는 값이 있으면 제한 재료로 처리
          const restrictedValue = row['못 먹는 재료 여부']?.trim();
          const isRestrictedIngredient =
            restrictedValue === 'O' ||
            restrictedValue === 'o' ||
            !!restrictedValue;

          if (!name) {
            const reason = `행 ${index + 1}: 재료 이름이 없습니다.`;
            this.logger.warn(`${reason} 건너뜁니다.`);
            skippedRows.push(row);
            skippedReasons.push(reason);
            continue;
          }

          if (division === '식재료') {
            // 식재료 처리
            let ingredient = await this.findIngredientByName(name);

            if (ingredient) {
              const reason = `재료 "${name}"이 이미 존재합니다.`;
              this.logger.log(`${reason} 건너뜁니다.`);
              skippedIngredientCount++;
              skippedRows.push(row);
              skippedReasons.push(reason);
              continue;
            }

            // 카테고리 찾기 또는 생성
            if (!categoryName) {
              const reason = `행 ${index + 1}: 재료 "${name}"의 카테고리가 지정되지 않았습니다.`;
              this.logger.warn(`${reason} 건너뜁니다.`);
              skippedRows.push(row);
              skippedReasons.push(reason);
              continue;
            }

            let category = await this.ingredientCategoryRepository.findOne({
              where: { name: categoryName },
            });

            if (!category) {
              this.logger.log(
                `카테고리 "${categoryName}"이 없어 새로 생성합니다.`,
              );
              category = this.ingredientCategoryRepository.create({
                name: categoryName,
              });
              category = await this.ingredientCategoryRepository.save(category);
            }

            ingredient = this.ingredientRepository.create({
              name,
              ingredientCategoryId: category.id,
              isRestrictedIngredient,
            });
            ingredient = await this.ingredientRepository.save(ingredient);
            createdIngredientCount++;
            this.logger.log(
              `재료 생성 완료: ${name} (카테고리: ${category.name}, 제한재료: ${isRestrictedIngredient})`,
            );
          } else if (division === '양념') {
            // 양념 처리
            let seasoning = await this.findSeasoningByName(name);

            if (seasoning) {
              const reason = `양념 "${name}"이 이미 존재합니다.`;
              this.logger.log(`${reason} 건너뜁니다.`);
              skippedSeasoningCount++;
              skippedRows.push(row);
              skippedReasons.push(reason);
              continue;
            }

            seasoning = this.seasoningRepository.create({ name });
            seasoning = await this.seasoningRepository.save(seasoning);
            createdSeasoningCount++;
            this.logger.log(`양념 생성 완료: ${name}`);
          } else {
            const reason = `행 ${index + 1}: 알 수 없는 구분 "${division}"입니다.`;
            this.logger.warn(`${reason} 건너뜁니다.`);
            skippedRows.push(row);
            skippedReasons.push(reason);
          }
        } catch (error) {
          this.logger.error(`행 ${index + 1} 처리 실패: ${row.재료}`, error);
          throw new CustomException({
            code: ERROR_CODES.RECIPE_CREATE_FAILED.code,
            message: `재료/양념 "${row.재료}" 생성 실패: ${error.message}`,
          });
        }
      }

      this.logger.log(
        `총 ${createdIngredientCount}개의 재료, ${createdSeasoningCount}개의 양념이 생성되었습니다.`,
      );
      this.logger.log(
        `${skippedIngredientCount}개의 재료, ${skippedSeasoningCount}개의 양념이 이미 존재하여 건너뛰었습니다.`,
      );

      // 스킵된 데이터가 있으면 엑셀 파일 생성
      let skippedExcelBuffer: Buffer | null = null;
      let skippedFileName: string | null = null;

      if (skippedRows.length > 0) {
        skippedExcelBuffer = this.createSkippedDataExcel(
          skippedRows,
          skippedReasons,
        );
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        skippedFileName = `skipped_data_${timestamp}.xlsx`;
      }

      return {
        createdIngredientCount,
        createdSeasoningCount,
        skippedIngredientCount,
        skippedSeasoningCount,
        skippedExcelBuffer,
        skippedFileName,
      };
    } catch (error) {
      this.logger.error('CSV 파싱 중 오류 발생', error);
      throw new CustomException({
        code: ERROR_CODES.RECIPE_CREATE_FAILED.code,
        message: `CSV 파싱 실패: ${error.message}`,
      });
    }
  }
}
