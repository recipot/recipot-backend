import { ERROR_CODES } from '@/common/constants/error-codes';
import { EXCEL_COLUMNS } from '@/common/constants/excel-columns.constants';
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
import { CreateRecipeDto } from '../dto/create-recipe.dto';
import { RecipeService } from '../recipe.service';

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
    private readonly recipeService: RecipeService,
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
    skippedRows: Record<string, any>[],
    skippedReasons: string[],
  ): Buffer {
    if (skippedRows.length === 0) {
      return null;
    }

    // 스킵 이유를 포함한 데이터 준비
    const data = skippedRows.map((row, index) => ({
      [EXCEL_COLUMNS.INGREDIENT.NAME]: row[EXCEL_COLUMNS.INGREDIENT.NAME] || '',
      [EXCEL_COLUMNS.INGREDIENT.DIVISION]:
        row[EXCEL_COLUMNS.INGREDIENT.DIVISION] || '',
      [EXCEL_COLUMNS.INGREDIENT.CATEGORY]:
        row[EXCEL_COLUMNS.INGREDIENT.CATEGORY] || '',
      [EXCEL_COLUMNS.INGREDIENT.IS_RESTRICTED]:
        row[EXCEL_COLUMNS.INGREDIENT.IS_RESTRICTED] || '',
      [EXCEL_COLUMNS.INGREDIENT.COPY]: row[EXCEL_COLUMNS.INGREDIENT.COPY] || '',
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
   * 엑셀 파일을 파싱하여 객체 배열로 변환합니다.
   */
  private parseExcelFile(buffer: Buffer): Record<string, any>[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // 엑셀 데이터를 객체 배열로 변환
    return jsonData.map((row: any) => {
      const result: Record<string, any> = {};
      // 모든 키를 정규화 (공백 제거 등)
      Object.keys(row).forEach((key) => {
        const normalizedKey = key.trim();
        result[normalizedKey] = row[key];
      });
      return result;
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
   * 재료/양념 문자열을 파싱합니다.
   * 예: "땅콩버터 1T, 바나나 1개, 돼지고기 (대패삼겹살) 150g"
   * -> [{ name: "땅콩버터", amount: "1T" }, { name: "바나나", amount: "1개" }, { name: "돼지고기 (대패삼겹살)", amount: "150g" }]
   */
  private parseIngredientOrSeasoningString(
    text: string,
  ): Array<{ name: string; amount: string }> {
    if (!text || !text.trim()) {
      return [];
    }

    const items: Array<{ name: string; amount: string }> = [];
    const parts = text.split(',').map((p) => p.trim());

    for (const part of parts) {
      if (!part) continue;

      // 마지막 공백을 기준으로 이름과 양을 분리
      // 예: "땅콩버터 1T" -> name: "땅콩버터", amount: "1T"
      // 예: "돼지고기 (대패삼겹살) 150g" -> name: "돼지고기 (대패삼겹살)", amount: "150g"
      const lastSpaceIndex = part.lastIndexOf(' ');
      if (lastSpaceIndex > 0) {
        const name = part.substring(0, lastSpaceIndex).trim();
        const amount = part.substring(lastSpaceIndex + 1).trim();
        if (name && amount) {
          items.push({ name, amount });
        } else {
          // 이름은 있지만 양이 없는 경우 (공백이 이름 안에 있는 경우)
          items.push({ name: part, amount: '' });
        }
      } else {
        // 공백이 없으면 전체를 이름으로 처리
        items.push({ name: part, amount: '' });
      }
    }

    return items;
  }

  /**
   * 조리도구 문자열을 파싱합니다.
   * 예: "칼, 냄비" -> ["칼", "냄비"]
   */
  private parseToolString(text: string): string[] {
    if (!text || !text.trim()) {
      return [];
    }

    return text
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }

  /**
   * 조리 시간 문자열에서 숫자(분)를 추출합니다.
   * 예: "5" -> 5, "5분" -> 5
   */
  private parseDurationMinutes(durationText: string): number {
    if (!durationText) {
      throw new CustomException({
        code: ERROR_CODES.VALIDATION_ERROR.code,
        message: '조리 시간이 필요합니다.',
      });
    }

    // 앞뒤 공백 제거
    const trimmed = durationText.trim();

    // 숫자만 추출 (예: "5", "5분", "10 분" 등 모두 처리)
    const match = trimmed.match(/^(\d+)/);
    if (!match) {
      throw new CustomException({
        code: ERROR_CODES.VALIDATION_ERROR.code,
        message: `조리 시간 형식이 올바르지 않습니다: ${durationText}. 숫자만 입력하세요 (예: 5 또는 5분)`,
      });
    }

    const minutes = parseInt(match[1], 10);
    if (isNaN(minutes) || minutes <= 0) {
      throw new CustomException({
        code: ERROR_CODES.VALIDATION_ERROR.code,
        message: `조리 시간은 1 이상의 숫자여야 합니다: ${durationText}`,
      });
    }

    return minutes;
  }

  /**
   * 엑셀 파일을 파싱하여 레시피 데이터를 추출합니다.
   */
  private parseRecipeExcelFile(buffer: Buffer): Record<string, any>[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // 엑셀 데이터를 객체 배열로 변환
    // 컬럼명은 정확히 일치해야 하므로 공백 제거 없이 그대로 사용
    return jsonData.map((row: any) => {
      const result: Record<string, any> = {};
      Object.keys(row).forEach((key) => {
        // 공백만 제거 (앞뒤 공백 제거)
        const trimmedKey = key.trim();
        result[trimmedKey] = row[key];
      });
      return result;
    });
  }

  /**
   * 스킵된 레시피 데이터를 엑셀 파일로 변환합니다.
   */
  createSkippedRecipeExcel(
    skippedRows: Array<{
      row: Record<string, any>;
      rowNumber: number;
    }>,
    errors: Array<{ row: number; title: string; error: string }>,
  ): Buffer {
    if (skippedRows.length === 0) {
      return null;
    }

    // 에러 정보를 행 번호로 매핑
    const errorMap = new Map<number, string>();
    errors.forEach((err) => {
      errorMap.set(err.row, err.error);
    });

    // 첫 번째 row에서 모든 컬럼명 수집 (step 컬럼 포함)
    const allColumns = new Set<string>();
    if (skippedRows.length > 0) {
      Object.keys(skippedRows[0].row).forEach((key) => {
        allColumns.add(key);
      });
    }

    // 기본 컬럼 순서 정의
    const baseColumns = [
      EXCEL_COLUMNS.RECIPE.TITLE,
      EXCEL_COLUMNS.RECIPE.IMAGES,
      EXCEL_COLUMNS.RECIPE.DURATION,
      EXCEL_COLUMNS.RECIPE.CONDITION,
      EXCEL_COLUMNS.RECIPE.DESCRIPTION,
      EXCEL_COLUMNS.RECIPE.TOOLS,
      EXCEL_COLUMNS.RECIPE.INGREDIENTS,
      EXCEL_COLUMNS.RECIPE.NON_ALTERNATIVE_INGREDIENTS,
      EXCEL_COLUMNS.RECIPE.SEASONINGS,
    ];

    // step 관련 컬럼만 추출하여 정렬 (1step 요약, 1step, 1step 이미지, 2step 요약, 2step, 2step 이미지, ...)
    const stepColumns = Array.from(allColumns)
      .filter(
        (col) =>
          /^\d+step\s*요약$/.test(col) ||
          /^\d+step$/.test(col) ||
          /^\d+step\s*이미지$/.test(col),
      )
      .sort((a, b) => {
        // 숫자 추출하여 정렬
        const numA = parseInt(a.match(/^(\d+)/)?.[1] || '0', 10);
        const numB = parseInt(b.match(/^(\d+)/)?.[1] || '0', 10);
        if (numA !== numB) return numA - numB;
        // 같은 숫자면 요약 -> step -> 이미지 순서
        if (a.includes('요약')) return -1;
        if (b.includes('요약')) return 1;
        if (a.includes('이미지')) return 1;
        if (b.includes('이미지')) return -1;
        return 0;
      });

    // 스킵 이유를 포함한 데이터 준비
    const data = skippedRows.map((item) => {
      const row = item.row;
      const rowNumber = item.rowNumber;
      const error = errorMap.get(rowNumber) || '';

      const rowData: Record<string, any> = {};
      // 기본 컬럼 추가
      for (const col of baseColumns) {
        rowData[col] = row[col] || '';
      }
      // step 컬럼 추가
      for (const col of stepColumns) {
        rowData[col] = row[col] || '';
      }
      // 스킵 이유 추가
      rowData['스킵 이유'] = error;

      return rowData;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '스킵된 데이터');

    // 버퍼로 변환
    return Buffer.from(
      XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }),
    );
  }

  /**
   * 엑셀 파일을 파싱하여 레시피를 생성합니다.
   */
  async importRecipesFromExcel(buffer: Buffer): Promise<{
    createdRecipeCount: number;
    skippedRecipeCount: number;
    errors: Array<{ row: number; title: string; error: string }>;
    skippedExcelBuffer: Buffer | null;
    skippedFileName: string | null;
  }> {
    try {
      const records = this.parseRecipeExcelFile(buffer);
      this.logger.log(
        `엑셀 파일에서 ${records.length}개의 레시피 데이터를 찾았습니다.`,
      );

      let createdRecipeCount = 0;
      let skippedRecipeCount = 0;
      const errors: Array<{ row: number; title: string; error: string }> = [];
      const skippedRows: Array<{
        row: Record<string, any>;
        rowNumber: number;
      }> = [];

      for (const [index, row] of records.entries()) {
        const rowNumber = index + 1;
        try {
          // 정확한 컬럼명만 허용 (엑셀에서 숫자로 읽혀올 수 있으므로 문자열로 변환)
          const title = row[EXCEL_COLUMNS.RECIPE.TITLE]
            ? String(row[EXCEL_COLUMNS.RECIPE.TITLE])
            : '';
          const imagesText = row[EXCEL_COLUMNS.RECIPE.IMAGES]
            ? String(row[EXCEL_COLUMNS.RECIPE.IMAGES])
            : '';
          const durationText = row[EXCEL_COLUMNS.RECIPE.DURATION]
            ? String(row[EXCEL_COLUMNS.RECIPE.DURATION])
            : '';
          const conditionName = row[EXCEL_COLUMNS.RECIPE.CONDITION]
            ? String(row[EXCEL_COLUMNS.RECIPE.CONDITION])
            : '';
          const description = row[EXCEL_COLUMNS.RECIPE.DESCRIPTION]
            ? String(row[EXCEL_COLUMNS.RECIPE.DESCRIPTION])
            : '';
          const toolsText = row[EXCEL_COLUMNS.RECIPE.TOOLS]
            ? String(row[EXCEL_COLUMNS.RECIPE.TOOLS])
            : '';
          const ingredientsText = row[EXCEL_COLUMNS.RECIPE.INGREDIENTS]
            ? String(row[EXCEL_COLUMNS.RECIPE.INGREDIENTS])
            : '';
          const nonAlternativeIngredientsText = row[
            EXCEL_COLUMNS.RECIPE.NON_ALTERNATIVE_INGREDIENTS
          ]
            ? String(row[EXCEL_COLUMNS.RECIPE.NON_ALTERNATIVE_INGREDIENTS])
            : '';
          const seasoningsText = row[EXCEL_COLUMNS.RECIPE.SEASONINGS]
            ? String(row[EXCEL_COLUMNS.RECIPE.SEASONINGS])
            : '';

          // 필수 필드 검증
          if (!title || !title.trim()) {
            errors.push({
              row: rowNumber,
              title: title || '(제목 없음)',
              error: '레시피 타이틀이 없습니다.',
            });
            skippedRows.push({ row, rowNumber });
            skippedRecipeCount++;
            continue;
          }

          if (!durationText || !durationText.trim()) {
            errors.push({
              row: rowNumber,
              title,
              error: '조리 시간이 없습니다.',
            });
            skippedRows.push({ row, rowNumber });
            skippedRecipeCount++;
            continue;
          }

          if (!conditionName || !conditionName.trim()) {
            errors.push({
              row: rowNumber,
              title,
              error: '유저 컨디션이 없습니다.',
            });
            skippedRows.push({ row, rowNumber });
            skippedRecipeCount++;
            continue;
          }

          if (!description || !description.trim()) {
            errors.push({
              row: rowNumber,
              title,
              error: '한줄 카피가 없습니다.',
            });
            skippedRows.push({ row, rowNumber });
            skippedRecipeCount++;
            continue;
          }

          // 컨디션 찾기
          const condition = await this.conditionRepository.findOne({
            where: { name: conditionName.trim() },
          });

          if (!condition) {
            errors.push({
              row: rowNumber,
              title,
              error: `컨디션 "${conditionName}"을 찾을 수 없습니다.`,
            });
            skippedRows.push({ row, rowNumber });
            skippedRecipeCount++;
            continue;
          }

          // 조리 시간 파싱 (분 단위 숫자)
          const durationMinutes = this.parseDurationMinutes(
            durationText.trim(),
          );

          // 재료 파싱 및 검증
          const ingredientItems = this.parseIngredientOrSeasoningString(
            ingredientsText || '',
          );

          // 대체불가능 재료 목록 파싱 (쉼표로 구분)
          const nonAlternativeIngredientNames = (
            nonAlternativeIngredientsText || ''
          )
            .split(',')
            .map((name) => name.trim())
            .filter((name) => name.length > 0);

          const recipeIngredients = [];
          for (const item of ingredientItems) {
            const searchName = item.name.trim();

            const ingredient = await this.findIngredientByName(searchName);
            if (!ingredient) {
              errors.push({
                row: rowNumber,
                title,
                error: `재료 "${searchName}"을 찾을 수 없습니다.`,
              });
              throw new Error(`재료 "${searchName}"을 찾을 수 없습니다.`);
            }

            // 대체불가능 재료 목록에 있으면 false, 없으면 true
            const isAlternative =
              !nonAlternativeIngredientNames.includes(searchName);

            recipeIngredients.push({
              ingredientId: ingredient.id,
              isAlternative,
              amount: item.amount,
            });
          }

          // 양념 파싱 및 검증
          const seasoningItems = this.parseIngredientOrSeasoningString(
            seasoningsText || '',
          );
          const recipeSeasonings = [];
          for (const item of seasoningItems) {
            const seasoning = await this.findSeasoningByName(item.name);
            if (!seasoning) {
              errors.push({
                row: rowNumber,
                title,
                error: `양념 "${item.name}"을 찾을 수 없습니다.`,
              });
              throw new Error(`양념 "${item.name}"을 찾을 수 없습니다.`);
            }
            recipeSeasonings.push({
              seasoningId: seasoning.id,
              amount: item.amount,
            });
          }

          // 조리도구 파싱 및 검증 (없으면 자동 생성)
          const toolNames = this.parseToolString(toolsText || '');
          const recipeTools = [];
          for (const toolName of toolNames) {
            let tool = await this.findToolByName(toolName);
            if (!tool) {
              // 조리도구가 없으면 자동으로 생성
              this.logger.log(`조리도구 "${toolName}"이 없어 새로 생성합니다.`);
              tool = this.toolRepository.create({
                name: toolName,
                imageUrl: '', // 엑셀에서 이미지 URL을 제공하지 않으므로 빈 문자열
              });
              tool = await this.toolRepository.save(tool);
            }
            recipeTools.push({
              toolId: tool.id,
            });
          }

          // 레시피 이미지 파싱 (콤마로 구분된 URL 리스트)
          const recipeImages = [];
          if (imagesText && imagesText.trim()) {
            const imageUrls = imagesText
              .split(',')
              .map((url) => url.trim())
              .filter((url) => url.length > 0);
            recipeImages.push(...imageUrls.map((imageUrl) => ({ imageUrl })));
          }

          // 조리과정 파싱 (동적으로 처리: 1step 요약, 1step, 1step 이미지, 2step 요약, 2step, 2step 이미지, ...)
          const steps = [];
          const stepMap = new Map<
            number,
            { summary: string; content: string; imageUrl: string | null }
          >();

          // 엑셀의 모든 컬럼을 순회하여 step 관련 컬럼 찾기
          for (const [columnName, value] of Object.entries(row)) {
            // 값이 없거나 빈 값이면 스킵
            if (value === null || value === undefined) continue;
            const valueStr = String(value).trim();
            if (!valueStr) continue;

            // {숫자}step 요약 패턴 찾기
            const summaryMatch = columnName.match(/^(\d+)step\s*요약$/);
            if (summaryMatch) {
              const stepNum = parseInt(summaryMatch[1], 10);
              if (!stepMap.has(stepNum)) {
                stepMap.set(stepNum, {
                  summary: '',
                  content: '',
                  imageUrl: null,
                });
              }
              stepMap.get(stepNum)!.summary = valueStr;
            }

            // {숫자}step 패턴 찾기 (content)
            const stepMatch = columnName.match(/^(\d+)step$/);
            if (stepMatch) {
              const stepNum = parseInt(stepMatch[1], 10);
              if (!stepMap.has(stepNum)) {
                stepMap.set(stepNum, {
                  summary: '',
                  content: '',
                  imageUrl: null,
                });
              }
              stepMap.get(stepNum)!.content = valueStr;
            }

            // {숫자}step 이미지 패턴 찾기
            const stepImageMatch = columnName.match(/^(\d+)step\s*이미지$/);
            if (stepImageMatch) {
              const stepNum = parseInt(stepImageMatch[1], 10);
              if (!stepMap.has(stepNum)) {
                stepMap.set(stepNum, {
                  summary: '',
                  content: '',
                  imageUrl: null,
                });
              }
              stepMap.get(stepNum)!.imageUrl = valueStr;
            }
          }

          // step 번호 순서대로 정렬하여 배열로 변환
          const sortedStepNumbers = Array.from(stepMap.keys()).sort(
            (a, b) => a - b,
          );

          for (const stepNum of sortedStepNumbers) {
            const stepData = stepMap.get(stepNum)!;
            const content = stepData.content.trim();
            const summary = stepData.summary.trim();
            const imageUrl = stepData.imageUrl?.trim();

            // content와 summary가 모두 있어야 step으로 인정
            if (content && summary) {
              steps.push({
                orderNum: stepNum,
                summary: summary, // 요약 열에서만 가져옴
                content,
                imageUrl, // optional이므로 그대로 전달
              });
            } else {
              // summary나 content가 없으면 스킵하고 로그 남기기
              if (!summary) {
                this.logger.warn(
                  `레시피 "${title}"의 ${stepNum}단계: 요약이 없어 스킵되었습니다.`,
                );
              }
              if (!content) {
                this.logger.warn(
                  `레시피 "${title}"의 ${stepNum}단계: 내용이 없어 스킵되었습니다.`,
                );
              }
            }
          }

          if (steps.length === 0) {
            errors.push({
              row: rowNumber,
              title,
              error: '조리과정이 없습니다.',
            });
            skippedRows.push({ row, rowNumber });
            skippedRecipeCount++;
            continue;
          }

          // CreateRecipeDto 생성
          const createRecipeDto: CreateRecipeDto = {
            title: title.trim(),
            description: description.trim(),
            duration: durationMinutes,
            images: recipeImages.length > 0 ? recipeImages : undefined,
            ingredients: recipeIngredients,
            seasonings:
              recipeSeasonings.length > 0 ? recipeSeasonings : undefined,
            tools: recipeTools.length > 0 ? recipeTools : undefined,
            steps,
            conditionWeights: [
              {
                conditionId: condition.id,
                priorityScore: 1.0,
              },
            ],
          };

          // 레시피 생성
          await this.recipeService.createRecipe(createRecipeDto);
          createdRecipeCount++;
          this.logger.log(`레시피 생성 완료: ${title}`);
        } catch (error) {
          if (
            !errors.some(
              (e) => e.row === rowNumber && e.error === error.message,
            )
          ) {
            errors.push({
              row: rowNumber,
              title: row[EXCEL_COLUMNS.RECIPE.TITLE] || '(제목 없음)',
              error: error.message || '알 수 없는 오류',
            });
          }
          skippedRows.push({ row, rowNumber });
          skippedRecipeCount++;
          this.logger.error(`행 ${rowNumber} 처리 실패`, error);
        }
      }

      this.logger.log(`총 ${createdRecipeCount}개의 레시피가 생성되었습니다.`);
      this.logger.log(`${skippedRecipeCount}개의 레시피가 건너뛰었습니다.`);

      // 스킵된 데이터가 있으면 엑셀 파일 생성
      let skippedExcelBuffer: Buffer | null = null;
      let skippedFileName: string | null = null;

      if (skippedRows.length > 0) {
        skippedExcelBuffer = this.createSkippedRecipeExcel(skippedRows, errors);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        skippedFileName = `skipped_recipes_${timestamp}.xlsx`;
      }

      return {
        createdRecipeCount,
        skippedRecipeCount,
        errors,
        skippedExcelBuffer,
        skippedFileName,
      };
    } catch (error) {
      this.logger.error('레시피 엑셀 파싱 중 오류 발생', error);
      throw new CustomException({
        code: ERROR_CODES.RECIPE_CREATE_FAILED.code,
        message: `레시피 엑셀 파싱 실패: ${error.message}`,
      });
    }
  }

  /**
   * 엑셀 파일을 파싱하여 재료와 양념을 생성합니다.
   */
  async importIngredientsAndSeasoningsFromExcel(buffer: Buffer): Promise<{
    createdIngredientCount: number;
    createdSeasoningCount: number;
    skippedIngredientCount: number;
    skippedSeasoningCount: number;
    skippedExcelBuffer: Buffer | null;
    skippedFileName: string | null;
  }> {
    try {
      // 엑셀 파일 파싱
      const records = this.parseExcelFile(buffer);
      this.logger.log(
        `엑셀 파일에서 ${records.length}개의 재료/양념 데이터를 찾았습니다.`,
      );

      let createdIngredientCount = 0;
      let createdSeasoningCount = 0;
      let skippedIngredientCount = 0;
      let skippedSeasoningCount = 0;
      const skippedRows: Record<string, any>[] = [];
      const skippedReasons: string[] = [];

      // 각 행을 순차적으로 처리
      for (const [index, row] of records.entries()) {
        try {
          const name = row[EXCEL_COLUMNS.INGREDIENT.NAME]?.trim();
          const division = row[EXCEL_COLUMNS.INGREDIENT.DIVISION]?.trim(); // '식재료' or '양념'
          const categoryName = row[EXCEL_COLUMNS.INGREDIENT.CATEGORY]?.trim();
          // "못 먹는 재료 여부" 컬럼에서 "O" 또는 값이 있으면 제한 재료로 처리
          const restrictedValue =
            row[EXCEL_COLUMNS.INGREDIENT.IS_RESTRICTED]?.trim();
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
          this.logger.error(
            `행 ${index + 1} 처리 실패: ${row[EXCEL_COLUMNS.INGREDIENT.NAME]}`,
            error,
          );
          throw new CustomException({
            code: ERROR_CODES.RECIPE_CREATE_FAILED.code,
            message: `재료/양념 "${row[EXCEL_COLUMNS.INGREDIENT.NAME]}" 생성 실패: ${error.message}`,
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
      this.logger.error('엑셀 파싱 중 오류 발생', error);
      throw new CustomException({
        code: ERROR_CODES.RECIPE_CREATE_FAILED.code,
        message: `엑셀 파싱 실패: ${error.message}`,
      });
    }
  }
}
