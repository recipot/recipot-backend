import { ERROR_CODES } from '@/common/constants/error-codes';
import { EXCEL_COLUMNS } from '@/common/constants/excel-columns.constants';
import { CustomException } from '@/common/exceptions/custom-exception';
import { CommonCode } from '@/database/entity/common-code.entity';
import { Condition } from '@/database/entity/condition.entity';
import { IngredientCategory } from '@/database/entity/ingredient-category.entity';
import { IngredientHealthInfo } from '@/database/entity/ingredient-health-info.entity';
import { Ingredient } from '@/database/entity/ingredient.entity';
import { RecipeImage } from '@/database/entity/recipe-image.entity';
import { RecipeStep } from '@/database/entity/recipe-step.entity';
import { Recipe } from '@/database/entity/recipe.entity';
import { Seasoning } from '@/database/entity/seasoning.entity';
import { Tool } from '@/database/entity/tool.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import * as XLSX from 'xlsx';
import { DIVISION, EXCEL_SHEET_NAME } from '../constants/file-import.constants';
import { CreateRecipeDto } from '../dto/create-recipe.dto';
import { RecipeService } from '../recipe.service';
import { RecipeError } from '../types/file-import.types';
import { ExcelNormalizerUtil } from '../utils/excel-normalizer.util';
import { IngredientSeasoningParserUtil } from '../utils/ingredient-seasoning-parser.util';
import { RecipeImageParserUtil } from '../utils/recipe-image-parser.util';
import { RecipeParserUtil } from '../utils/recipe-parser.util';
import { FileImportValidator } from '../validators/file-import.validator';

// ============================================================================
// 서비스 클래스
// ============================================================================

@Injectable()
export class FileImportService {
  private readonly logger = new Logger(FileImportService.name);

  constructor(
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
    @InjectRepository(IngredientCategory)
    private readonly ingredientCategoryRepository: Repository<IngredientCategory>,
    @InjectRepository(IngredientHealthInfo)
    private readonly ingredientHealthInfoRepository: Repository<IngredientHealthInfo>,
    @InjectRepository(Seasoning)
    private readonly seasoningRepository: Repository<Seasoning>,
    @InjectRepository(Tool)
    private readonly toolRepository: Repository<Tool>,
    @InjectRepository(Condition)
    private readonly conditionRepository: Repository<Condition>,
    @InjectRepository(CommonCode)
    private readonly commonCodeRepository: Repository<CommonCode>,
    @InjectRepository(Recipe)
    private readonly recipeRepository: Repository<Recipe>,
    @InjectRepository(RecipeImage)
    private readonly recipeImageRepository: Repository<RecipeImage>,
    @InjectRepository(RecipeStep)
    private readonly recipeStepRepository: Repository<RecipeStep>,
    private readonly recipeService: RecipeService,
  ) {}

  // ============================================================================
  // 엔티티 조회 메서드
  // ============================================================================

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

  // ============================================================================
  // 엑셀 파일 관련 메서드
  // ============================================================================

  /**
   * 파일이 유효한 엑셀 파일인지 검증합니다.
   */
  validateExcelFile(file: Express.Multer.File): void {
    FileImportValidator.validateExcelFile(file);
  }

  /**
   * 엑셀 파일을 파싱하여 객체 배열로 변환합니다.
   * 엑셀 파일을 읽어서 JavaScript 객체 배열로 변환합니다.
   * 재료/양념 엑셀과 레시피 엑셀 모두에 사용됩니다.
   *
   * @param buffer 엑셀 파일의 버퍼 데이터
   * @returns 파싱된 데이터 배열 (각 객체는 컬럼명을 키로 가짐, 컬럼명의 앞뒤 공백은 제거됨)
   */
  private parseExcelFile(buffer: Buffer): Record<string, any>[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // 각 행의 데이터를 정규화하여 반환
    return jsonData.map((row: any) => {
      return ExcelNormalizerUtil.normalizeExcelRow(row);
    });
  }

  /**
   * 엑셀 버퍼를 생성합니다.
   * 데이터 배열을 받아서 엑셀 파일 버퍼를 생성합니다.
   *
   * @param data 엑셀에 기록할 데이터 배열
   * @param sheetName 엑셀 시트 이름
   * @returns 생성된 엑셀 파일 버퍼
   */
  private createExcelBuffer(data: any[], sheetName: string): Buffer {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    return Buffer.from(
      XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }),
    );
  }

  /**
   * 스킵된 데이터를 엑셀 파일로 변환합니다.
   * 재료/양념 임포트 중 스킵된 행들을 엑셀 파일로 만들어 반환합니다.
   *
   * @param skippedRows 스킵된 행 데이터 배열
   * @param skippedReasons 각 행의 스킵 이유 배열
   * @returns 생성된 엑셀 파일 버퍼 (스킵된 행이 없으면 null)
   */
  createSkippedDataExcel(
    skippedRows: Record<string, any>[],
    skippedReasons: string[],
  ): Buffer | null {
    // 스킵된 행이 없으면 null 반환
    if (skippedRows.length === 0) {
      return null;
    }

    // 스킵된 데이터와 스킵 이유를 합쳐서 엑셀에 기록할 데이터 형식으로 변환
    const data = skippedRows.map((row, index) => ({
      // 재료 이름
      [EXCEL_COLUMNS.INGREDIENT.NAME]: row[EXCEL_COLUMNS.INGREDIENT.NAME] || '',
      // 구분 (식재료/양념)
      [EXCEL_COLUMNS.INGREDIENT.DIVISION]:
        row[EXCEL_COLUMNS.INGREDIENT.DIVISION] || '',
      // 카테고리
      [EXCEL_COLUMNS.INGREDIENT.CATEGORY]:
        row[EXCEL_COLUMNS.INGREDIENT.CATEGORY] || '',
      // 제한 재료 여부
      [EXCEL_COLUMNS.INGREDIENT.IS_RESTRICTED]:
        row[EXCEL_COLUMNS.INGREDIENT.IS_RESTRICTED] || '',
      // 재료 한줄 카피
      [EXCEL_COLUMNS.INGREDIENT.COPY]: row[EXCEL_COLUMNS.INGREDIENT.COPY] || '',
      // 스킵 이유 추가
      [EXCEL_SHEET_NAME.SKIP_REASON_COLUMN]: skippedReasons[index] || '',
    }));

    // 엑셀 버퍼 생성 및 반환
    return this.createExcelBuffer(data, EXCEL_SHEET_NAME.SKIPPED);
  }

  // ============================================================================
  // 파싱 관련 메서드
  // ============================================================================

  /**
   * 스킵된 레시피 데이터를 엑셀 파일로 변환합니다.
   * 레시피 임포트 중 스킵된 행들과 에러 정보를 합쳐서 엑셀 파일로 만들어 반환합니다.
   * 기본 컬럼과 step 컬럼을 올바른 순서로 정렬하여 포함합니다.
   *
   * @param skippedRows 스킵된 레시피 행 데이터 배열
   * @param errors 각 행의 에러 정보 배열
   * @returns 생성된 엑셀 파일 버퍼 (스킵된 행이 없으면 null)
   */
  createSkippedRecipeExcel(
    skippedRows: Array<{
      row: Record<string, any>;
      rowNumber: number;
    }>,
    errors: RecipeError[],
  ): Buffer | null {
    // 스킵된 행이 없으면 null 반환
    if (skippedRows.length === 0) {
      return null;
    }

    // 에러 정보를 행 번호로 매핑하여 빠른 조회 가능하도록 함
    const errorMap = new Map<number, string>();
    errors.forEach((err) => {
      if (err && err.row !== undefined) {
        errorMap.set(err.row, err.error);
      }
    });

    // 모든 스킵된 행에서 컬럼명 수집 (step 컬럼 포함)
    // 이를 통해 동적으로 생성된 step 컬럼들도 포함시킬 수 있음
    // 각 행이 다른 수의 step 컬럼을 가질 수 있으므로 모든 행을 확인해야 함
    const allColumns = new Set<string>();
    skippedRows.forEach((item) => {
      if (item && item.row) {
        Object.keys(item.row).forEach((key) => {
          allColumns.add(key);
        });
      }
    });

    // 기본 컬럼 순서 정의 (레시피의 기본 정보 컬럼들)
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

    // step 관련 컬럼만 추출하여 정렬
    // 정렬 순서: 1step 요약, 1step, 1step 이미지, 2step 요약, 2step, 2step 이미지, ...
    const stepColumns = Array.from(allColumns)
      .filter(
        (col) =>
          /^\d+step\s*요약$/.test(col) ||
          /^\d+step$/.test(col) ||
          /^\d+step\s*이미지$/.test(col),
      )
      .sort((a, b) => {
        // 컬럼명에서 숫자 추출하여 단계 번호로 정렬
        const numA = parseInt(a.match(/^(\d+)/)?.[1] || '0', 10);
        const numB = parseInt(b.match(/^(\d+)/)?.[1] || '0', 10);
        // 단계 번호가 다르면 번호 순으로 정렬
        if (numA !== numB) return numA - numB;
        // 같은 단계 번호면 요약 -> step -> 이미지 순서로 정렬
        if (a.includes('요약')) return -1;
        if (b.includes('요약')) return 1;
        if (a.includes('이미지')) return 1;
        if (b.includes('이미지')) return -1;
        return 0;
      });

    // 스킵 이유를 포함한 데이터 준비
    const data = skippedRows
      .filter((item) => item && item.row) // 유효하지 않은 항목 필터링
      .map((item) => {
        const row = item.row;
        const rowNumber = item.rowNumber;
        // 해당 행 번호의 에러 메시지 가져오기 (없으면 빈 문자열)
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
        rowData[EXCEL_SHEET_NAME.SKIP_REASON_COLUMN] = error;

        return rowData;
      });

    // 엑셀 파일 생성
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, EXCEL_SHEET_NAME.SKIPPED);

    // 버퍼로 변환하여 반환
    return Buffer.from(
      XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }),
    );
  }

  // ============================================================================
  // 레시피 임포트 메서드
  // ============================================================================

  /**
   * 엑셀 파일을 파싱하여 레시피를 생성합니다.
   * 엑셀 파일을 읽어서 각 행의 데이터를 파싱하고 레시피를 생성합니다.
   * 에러가 발생한 행은 스킵하고, 스킵된 데이터는 별도의 엑셀 파일로 저장합니다.
   *
   * @param buffer 엑셀 파일의 버퍼 데이터
   * @returns 레시피 임포트 결과 (생성된 레시피 수, 스킵된 레시피 수, 에러 목록, 스킵된 데이터 엑셀 파일)
   */
  async importRecipesFromExcel(buffer: Buffer): Promise<{
    createdRecipeCount: number;
    skippedRecipeCount: number;
    errors: RecipeError[];
    skippedExcelBuffer: Buffer | null;
    skippedFileName: string | null;
  }> {
    try {
      // 엑셀 파일을 파싱하여 레시피 데이터 배열로 변환
      const records = this.parseExcelFile(buffer) || [];
      this.logger.log(
        `엑셀 파일에서 ${records.length}개의 레시피 데이터를 찾았습니다.`,
      );

      // 임포트 결과 추적 변수 초기화
      let createdRecipeCount = 0; // 성공적으로 생성된 레시피 수
      let skippedRecipeCount = 0; // 스킵된 레시피 수
      const errors: RecipeError[] = []; // 에러 목록
      const skippedRows: Array<{
        row: Record<string, any>;
        rowNumber: number;
      }> = []; // 스킵된 행 데이터 (엑셀 파일 생성용)

      // ============================================================================
      // 성능 최적화: N+1 쿼리 방지를 위한 일괄 조회
      // ============================================================================

      // 모든 컨디션 일괄 조회 및 Map 생성
      const allConditions = (await this.conditionRepository.find()) || [];
      const conditionMap = new Map<string, Condition>(
        allConditions.map((c) => [c.name, c]),
      );

      // 모든 레시피 행을 순회하여 필요한 재료/양념/도구 이름 수집
      const allIngredientNames = new Set<string>();
      const allSeasoningNames = new Set<string>();
      const allToolNames = new Set<string>();

      for (const row of records) {
        // 재료 이름 수집
        const ingredientsText = row[EXCEL_COLUMNS.RECIPE.INGREDIENTS]
          ? String(row[EXCEL_COLUMNS.RECIPE.INGREDIENTS])
          : '';
        const ingredientItems =
          IngredientSeasoningParserUtil.parseIngredientOrSeasoningString(
            ingredientsText || '',
          ) || [];
        ingredientItems.forEach((item) => {
          allIngredientNames.add(item.name.trim());
        });

        // 양념 이름 수집
        const seasoningsText = row[EXCEL_COLUMNS.RECIPE.SEASONINGS]
          ? String(row[EXCEL_COLUMNS.RECIPE.SEASONINGS])
          : '';
        const seasoningItems =
          IngredientSeasoningParserUtil.parseIngredientOrSeasoningString(
            seasoningsText || '',
          ) || [];
        seasoningItems.forEach((item) => {
          allSeasoningNames.add(item.name.trim());
        });

        // 도구 이름 수집
        const toolsText = row[EXCEL_COLUMNS.RECIPE.TOOLS]
          ? String(row[EXCEL_COLUMNS.RECIPE.TOOLS])
          : '';
        const toolNames =
          RecipeParserUtil.parseToolString(toolsText || '') || [];
        toolNames.forEach((toolName) => {
          allToolNames.add(toolName.trim());
        });
      }

      // 모든 재료 일괄 조회 및 Map 생성
      const ingredientMap = new Map<string, Ingredient>();
      if (allIngredientNames.size > 0) {
        const allIngredients =
          (await this.ingredientRepository.find({
            where: { name: In([...allIngredientNames]) },
          })) || [];
        allIngredients.forEach((i) => ingredientMap.set(i.name, i));
      }

      // 모든 양념 일괄 조회 및 Map 생성
      const seasoningMap = new Map<string, Seasoning>();
      if (allSeasoningNames.size > 0) {
        const allSeasonings =
          (await this.seasoningRepository.find({
            where: { name: In([...allSeasoningNames]) },
          })) || [];
        allSeasonings.forEach((s) => seasoningMap.set(s.name, s));
      }

      // 모든 도구 일괄 조회 및 Map 생성
      const toolMap = new Map<string, Tool>();
      if (allToolNames.size > 0) {
        const allTools =
          (await this.toolRepository.find({
            where: { name: In([...allToolNames]) },
          })) || [];
        allTools.forEach((t) => toolMap.set(t.name, t));
      }

      // 없는 도구들을 일괄 생성
      const missingToolNames = [...allToolNames].filter(
        (name) => !toolMap.has(name),
      );
      if (missingToolNames.length > 0) {
        this.logger.log(
          `${missingToolNames.length}개의 조리도구가 없어 새로 생성합니다.`,
        );
        const newTools = missingToolNames.map((toolName) =>
          this.toolRepository.create({
            name: toolName,
            imageUrl: '', // 엑셀에서 이미지 URL을 제공하지 않으므로 빈 문자열
          }),
        );
        const savedTools = (await this.toolRepository.save(newTools)) || [];
        savedTools.forEach((tool) => {
          toolMap.set(tool.name, tool);
        });
      }

      // ============================================================================
      // 레시피 생성 루프
      // ============================================================================

      // 각 행을 순회하면서 레시피 생성 시도
      for (const [index, row] of records.entries()) {
        const rowNumber = index + 1; // 엑셀 행 번호 (1부터 시작)
        try {
          // 엑셀 데이터에서 각 컬럼값 추출
          // 엑셀에서 숫자로 읽혀올 수 있으므로 모두 문자열로 변환
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

          // 컨디션 찾기 (Map에서 조회)
          const condition = conditionMap.get(conditionName.trim());

          // 필수 필드 검증 (컨디션 포함)
          const validationError =
            FileImportValidator.validateRecipeRequiredFields(
              row,
              rowNumber,
              condition,
            );
          if (validationError) {
            errors.push(validationError);
            skippedRows.push({ row, rowNumber });
            skippedRecipeCount++;
            continue;
          }

          // 조리 시간 파싱 (분 단위 숫자)
          const durationMinutes = FileImportValidator.parseDurationMinutes(
            durationText.trim(),
          );

          // 재료 파싱 및 검증
          const ingredientItems =
            IngredientSeasoningParserUtil.parseIngredientOrSeasoningString(
              ingredientsText || '',
            ) || [];

          // 대체불가능 재료 목록 파싱 (쉼표로 구분)
          const nonAlternativeIngredientNames =
            RecipeParserUtil.parseNonAlternativeIngredients(
              nonAlternativeIngredientsText || '',
            ) || [];

          const recipeIngredients = [];
          let hasIngredientError = false;
          for (const item of ingredientItems) {
            const searchName = item.name.trim();

            // Map에서 재료 조회
            const ingredient = ingredientMap.get(searchName);
            if (!ingredient) {
              errors.push(
                IngredientSeasoningParserUtil.createIngredientNotFoundError(
                  rowNumber,
                  title,
                  searchName,
                ),
              );
              hasIngredientError = true;
              break; // 재료 루프 탈출
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

          // 재료 에러가 있으면 레시피 스킵
          if (hasIngredientError) {
            skippedRows.push({ row, rowNumber });
            skippedRecipeCount++;
            continue;
          }

          // 양념 파싱 및 검증
          const seasoningItems =
            IngredientSeasoningParserUtil.parseIngredientOrSeasoningString(
              seasoningsText || '',
            ) || [];
          const recipeSeasonings = [];
          let hasSeasoningError = false;
          for (const item of seasoningItems) {
            // Map에서 양념 조회
            const seasoning = seasoningMap.get(item.name.trim());
            if (!seasoning) {
              errors.push(
                IngredientSeasoningParserUtil.createSeasoningNotFoundError(
                  rowNumber,
                  title,
                  item.name,
                ),
              );
              hasSeasoningError = true;
              break; // 양념 루프 탈출
            }
            recipeSeasonings.push({
              seasoningId: seasoning.id,
              amount: item.amount,
            });
          }

          // 양념 에러가 있으면 레시피 스킵
          if (hasSeasoningError) {
            skippedRows.push({ row, rowNumber });
            skippedRecipeCount++;
            continue;
          }

          // 조리도구 파싱 및 검증 (Map에서 조회, 이미 일괄 생성됨)
          const toolNames =
            RecipeParserUtil.parseToolString(toolsText || '') || [];
          const recipeTools = [];
          for (const toolName of toolNames) {
            // Map에서 도구 조회 (없는 도구는 이미 일괄 생성됨)
            const tool = toolMap.get(toolName.trim());
            if (!tool) {
              // 이론적으로는 발생하지 않아야 하지만 안전성을 위해 체크
              errors.push({
                row: rowNumber,
                title,
                error: `조리도구 "${toolName}"을 찾을 수 없습니다.`,
              });
              throw new Error(`조리도구 "${toolName}"을 찾을 수 없습니다.`);
            }
            recipeTools.push({
              toolId: tool.id,
            });
          }

          // 레시피 이미지 파싱 (콤마로 구분된 URL 리스트)
          const recipeImages =
            RecipeParserUtil.parseRecipeImages(imagesText || '') || [];

          // 조리과정 파싱 (동적으로 처리: 1step 요약, 1step, 1step 이미지, 2step 요약, 2step, 2step 이미지, ...)
          const steps =
            RecipeParserUtil.parseRecipeSteps(row, title, this.logger) || [];

          // 조리과정이 하나도 없으면 에러 처리
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
          // 파싱된 모든 데이터를 DTO 형식으로 변환
          const createRecipeDto: CreateRecipeDto = {
            title: title.trim(), // 레시피 제목
            description: description.trim(), // 레시피 한줄 설명
            duration: durationMinutes, // 조리 시간 (분)
            images: recipeImages.length > 0 ? recipeImages : undefined, // 레시피 이미지 목록
            ingredients: recipeIngredients, // 레시피 재료 목록
            seasonings:
              recipeSeasonings.length > 0 ? recipeSeasonings : undefined, // 레시피 양념 목록
            tools: recipeTools.length > 0 ? recipeTools : undefined, // 레시피 조리도구 목록
            steps, // 조리과정 단계 목록
            conditionId: condition.id, // 컨디션 ID
          };

          // 레시피 생성
          await this.recipeService.createRecipe(createRecipeDto);
          createdRecipeCount++;
          this.logger.log(`레시피 생성 완료: ${title}`);
        } catch (error) {
          // 에러 발생 시 처리
          // 중복 에러 추가 방지 (같은 행, 같은 에러 메시지가 이미 있는지 확인)
          const errorMessage = error?.message || '알 수 없는 오류';
          if (
            !errors.some(
              (e) => e && e.row === rowNumber && e.error === errorMessage,
            )
          ) {
            errors.push({
              row: rowNumber,
              title: row[EXCEL_COLUMNS.RECIPE.TITLE] || '(제목 없음)',
              error: errorMessage,
            });
          }
          skippedRows.push({ row, rowNumber });
          skippedRecipeCount++;
          this.logger.error(`행 ${rowNumber} 처리 실패`, error);
        }
      }

      // 임포트 완료 로그
      this.logger.log(`총 ${createdRecipeCount}개의 레시피가 생성되었습니다.`);
      this.logger.log(`${skippedRecipeCount}개의 레시피가 건너뛰었습니다.`);

      // 스킵된 데이터가 있으면 엑셀 파일 생성
      let skippedExcelBuffer: Buffer | null = null;
      let skippedFileName: string | null = null;

      // undefined 값 제거
      const validErrors = errors.filter((err) => err != null);

      if (skippedRows.length > 0) {
        // 스킵된 레시피 데이터를 엑셀 파일로 변환
        skippedExcelBuffer = this.createSkippedRecipeExcel(
          skippedRows,
          validErrors,
        );
        // 타임스탬프를 포함한 파일명 생성 (ISO 형식에서 파일명으로 사용 불가능한 문자 제거)
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        skippedFileName = `skipped_recipes_${timestamp}.xlsx`;
      }

      // 임포트 결과 반환
      return {
        createdRecipeCount,
        skippedRecipeCount,
        errors: validErrors,
        skippedExcelBuffer,
        skippedFileName,
      };
    } catch (error) {
      // 전체 임포트 과정에서 예상치 못한 에러 발생 시
      this.logger.error('레시피 엑셀 파싱 중 오류 발생', error);
      throw new CustomException({
        code: ERROR_CODES.RECIPE_CREATE_FAILED.code,
        message: `레시피 엑셀 파싱 실패: ${error.message}`,
      });
    }
  }

  // ============================================================================
  // 재료/양념 임포트 메서드
  // ============================================================================

  /**
   * 엑셀 파일을 파싱하여 재료와 양념을 생성합니다.
   * 엑셀 파일을 읽어서 각 행의 데이터를 파싱하고 재료 또는 양념을 생성합니다.
   * 구분(식재료/양념)에 따라 적절한 엔티티로 저장합니다.
   * 이미 존재하는 항목은 스킵하고, 스킵된 데이터는 별도의 엑셀 파일로 저장합니다.
   *
   * @param buffer 엑셀 파일의 버퍼 데이터
   * @returns 재료/양념 임포트 결과 (생성된 재료 수, 생성된 양념 수, 스킵된 항목 수, 스킵된 데이터 엑셀 파일)
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
      // 엑셀 파일 파싱하여 데이터 배열로 변환
      const records = this.parseExcelFile(buffer);
      this.logger.log(
        `엑셀 파일에서 ${records.length}개의 재료/양념 데이터를 찾았습니다.`,
      );

      // 임포트 결과 추적 변수 초기화
      let createdIngredientCount = 0; // 성공적으로 생성된 재료 수
      let createdSeasoningCount = 0; // 성공적으로 생성된 양념 수
      let skippedIngredientCount = 0; // 스킵된 재료 수 (이미 존재)
      let skippedSeasoningCount = 0; // 스킵된 양념 수 (이미 존재)
      const skippedRows: Record<string, any>[] = []; // 스킵된 행 데이터 (엑셀 파일 생성용)
      const skippedReasons: string[] = []; // 각 행의 스킵 이유

      // ============================================================================
      // 성능 최적화: N+1 쿼리 방지를 위한 일괄 조회
      // ============================================================================

      // 모든 기존 재료 일괄 조회 및 Map 생성
      const allIngredients = await this.ingredientRepository.find();
      const ingredientMap = new Map<string, Ingredient>(
        allIngredients.map((i) => [i.name, i]),
      );

      // 모든 기존 양념 일괄 조회 및 Map 생성
      const allSeasonings = await this.seasoningRepository.find();
      const seasoningMap = new Map<string, Seasoning>(
        allSeasonings.map((s) => [s.name, s]),
      );

      // 모든 카테고리 일괄 조회 및 Map 생성
      const allCategories = await this.ingredientCategoryRepository.find();
      const categoryMap = new Map<string, IngredientCategory>(
        allCategories.map((c) => [c.name, c]),
      );

      // ============================================================================
      // 재료/양념 생성 루프
      // ============================================================================

      // 각 행을 순차적으로 처리
      for (const [index, row] of records.entries()) {
        // 엑셀 데이터에서 각 컬럼값 추출 (catch 블록에서도 사용하므로 try 밖에서 선언)
        const name = row[EXCEL_COLUMNS.INGREDIENT.NAME]?.trim(); // 재료/양념 이름
        const division = row[EXCEL_COLUMNS.INGREDIENT.DIVISION]?.trim(); // 구분: '식재료' or '양념'
        const categoryName = row[EXCEL_COLUMNS.INGREDIENT.CATEGORY]?.trim(); // 카테고리 이름 (식재료만 해당)

        try {
          // 이미 존재하는 재료/양념 확인 (Map에서 조회)
          const existingIngredient =
            division === DIVISION.INGREDIENT
              ? ingredientMap.get(name) || null
              : null;
          const existingSeasoning =
            division === DIVISION.SEASONING
              ? seasoningMap.get(name) || null
              : null;

          // 필수 필드 검증
          const validationError =
            FileImportValidator.validateIngredientOrSeasoningRow(
              row,
              index + 1,
              existingIngredient,
              existingSeasoning,
            );
          if (validationError) {
            // 이미 존재하는 경우는 스킵 카운트 증가
            if (validationError.includes('이미 존재합니다')) {
              if (division === DIVISION.INGREDIENT) {
                skippedIngredientCount++;
              } else {
                skippedSeasoningCount++;
              }
            }
            this.logger.warn(`${validationError} 건너뜁니다.`);
            skippedRows.push(row);
            skippedReasons.push(validationError);
            continue;
          }

          // 구분에 따라 식재료 또는 양념 처리
          if (division === DIVISION.INGREDIENT) {
            // ===== 식재료 처리 =====
            // 카테고리 조회 또는 생성 (Map에서 조회)
            let category = categoryMap.get(categoryName);

            if (!category) {
              // 카테고리가 없으면 새로 생성
              this.logger.log(
                `카테고리 "${categoryName}"이 없어 새로 생성합니다.`,
              );
              category = this.ingredientCategoryRepository.create({
                name: categoryName,
              });
              category = await this.ingredientCategoryRepository.save(category);
              // 생성된 카테고리를 Map에 추가하여 중복 생성 방지
              categoryMap.set(categoryName, category);
            }

            // 제한 재료 여부 파싱
            const isRestrictedIngredient =
              IngredientSeasoningParserUtil.parseRestrictedIngredientValue(row);

            // 재료 생성 및 저장
            const ingredient = this.ingredientRepository.create({
              name,
              ingredientCategoryId: category.id,
              isRestrictedIngredient,
            });
            await this.ingredientRepository.save(ingredient);
            // 생성된 재료를 Map에 추가하여 중복 생성 방지
            ingredientMap.set(name, ingredient);
            createdIngredientCount++;
            this.logger.log(
              `재료 생성 완료: ${name} (카테고리: ${category.name}, 못 먹는 재료 노출: ${isRestrictedIngredient})`,
            );

            // 재료 한줄 카피(COPY) 필드가 있으면 ingredient_health_infos에 저장
            const copyContent = row[EXCEL_COLUMNS.INGREDIENT.COPY]?.trim();
            if (copyContent) {
              const ingredientHealthInfo =
                this.ingredientHealthInfoRepository.create({
                  ingredientId: ingredient.id,
                  content: copyContent,
                });
              await this.ingredientHealthInfoRepository.save(
                ingredientHealthInfo,
              );
              this.logger.log(
                `재료 건강 정보 생성 완료: ${name} - ${copyContent}`,
              );
            }
          } else if (division === DIVISION.SEASONING) {
            // ===== 양념 처리 =====
            // 양념 생성 및 저장 (양념은 이름만 필요)
            const seasoning = this.seasoningRepository.create({ name });
            await this.seasoningRepository.save(seasoning);
            // 생성된 양념을 Map에 추가하여 중복 생성 방지
            seasoningMap.set(name, seasoning);
            createdSeasoningCount++;
            this.logger.log(`양념 생성 완료: ${name}`);
          }
        } catch (error) {
          // 행 처리 중 예상치 못한 에러 발생 시
          this.logger.error(
            `행 ${index + 1} 처리 실패: ${row[EXCEL_COLUMNS.INGREDIENT.NAME]}`,
            error,
          );
          // 구분에 따라 적절한 에러 코드 사용
          const errorCode =
            division === DIVISION.INGREDIENT
              ? ERROR_CODES.INGREDIENT_CREATE_FAILED.code
              : ERROR_CODES.SEASONING_CREATE_FAILED.code;
          throw new CustomException({
            code: errorCode,
            message: `재료/양념 "${row[EXCEL_COLUMNS.INGREDIENT.NAME]}" 생성 실패: ${error.message}`,
          });
        }
      }

      // 임포트 완료 로그
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
        // 스킵된 데이터를 엑셀 파일로 변환
        skippedExcelBuffer = this.createSkippedDataExcel(
          skippedRows,
          skippedReasons,
        );
        // 타임스탬프를 포함한 파일명 생성 (ISO 형식에서 파일명으로 사용 불가능한 문자 제거)
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        skippedFileName = `skipped_data_${timestamp}.xlsx`;
      }

      // 임포트 결과 반환
      return {
        createdIngredientCount,
        createdSeasoningCount,
        skippedIngredientCount,
        skippedSeasoningCount,
        skippedExcelBuffer,
        skippedFileName,
      };
    } catch (error) {
      // 전체 임포트 과정에서 예상치 못한 에러 발생 시
      this.logger.error('엑셀 파싱 중 오류 발생', error);
      // 재료/양념 임포트 실패이므로 일반적인 유효성 검사 오류 코드 사용
      throw new CustomException({
        code: ERROR_CODES.VALIDATION_ERROR.code,
        message: `재료/양념 엑셀 파싱 실패: ${error.message}`,
      });
    }
  }

  // ============================================================================
  // 레시피 이미지 업데이트 메서드
  // ============================================================================

  /**
   * 엑셀 파일을 파싱하여 레시피 이미지를 업데이트합니다.
   * 엑셀 파일을 읽어서 각 행의 데이터를 파싱하고 레시피의 이미지를 업데이트합니다.
   * 에러가 발생한 행은 스킵하고, 스킵된 데이터는 별도의 엑셀 파일로 저장합니다.
   *
   * @param buffer 엑셀 파일의 버퍼 데이터
   * @returns 레시피 이미지 업데이트 결과 (업데이트된 레시피 수, 스킵된 레시피 수, 에러 목록, 스킵된 데이터 엑셀 파일)
   */
  async importRecipeImagesFromExcel(buffer: Buffer): Promise<{
    updatedRecipeCount: number;
    skippedRecipeCount: number;
    errors: RecipeError[];
    skippedExcelBuffer: Buffer | null;
    skippedFileName: string | null;
  }> {
    try {
      // 엑셀 파일을 파싱하여 레시피 데이터 배열로 변환
      const records = this.parseExcelFile(buffer) || [];
      this.logger.log(
        `엑셀 파일에서 ${records.length}개의 레시피 이미지 데이터를 찾았습니다.`,
      );

      // 임포트 결과 추적 변수 초기화
      let updatedRecipeCount = 0; // 성공적으로 업데이트된 레시피 수
      let skippedRecipeCount = 0; // 스킵된 레시피 수
      const errors: RecipeError[] = []; // 에러 목록
      const skippedRows: Array<{
        row: Record<string, any>;
        rowNumber: number;
      }> = []; // 스킵된 행 데이터 (엑셀 파일 생성용)

      // 각 행을 순회하면서 레시피 이미지 업데이트 시도
      for (const [index, row] of records.entries()) {
        const rowNumber = index + 2; // 엑셀 행 번호 (헤더 행 포함, 2부터 시작)
        try {
          // 레시피 ID 파싱
          const recipeId = RecipeImageParserUtil.parseRecipeId(row);

          // 헤더 행 및 빈 행 필터링: 레시피 ID가 없거나 유효하지 않으면 스킵
          if (!recipeId) {
            // 빈 행 체크: 모든 컬럼이 비어있는지 확인
            const hasAnyData = Object.values(row).some(
              (value) =>
                value !== null &&
                value !== undefined &&
                String(value).trim() !== '',
            );

            if (!hasAnyData) {
              // 완전히 빈 행인 경우 조용히 스킵
              this.logger.log(`행 ${rowNumber}: 빈 행으로 스킵합니다.`);
              continue;
            }

            // 데이터는 있지만 레시피 ID가 없는 경우 에러로 집계
            const validationError =
              FileImportValidator.validateRecipeImageRequiredFields(
                row,
                rowNumber,
                null,
              );
            if (validationError) {
              errors.push(validationError);
              skippedRows.push({ row, rowNumber });
              skippedRecipeCount++;
            }
            continue;
          }

          // 레시피 찾기
          const recipe = await this.recipeRepository.findOne({
            where: { id: recipeId },
          });

          // 필수 필드 검증
          const validationError =
            FileImportValidator.validateRecipeImageRequiredFields(
              row,
              rowNumber,
              recipe,
            );
          if (validationError) {
            errors.push(validationError);
            skippedRows.push({ row, rowNumber });
            skippedRecipeCount++;
            continue;
          }

          // 레시피 이미지 파싱 (쉼표로 구분된 URL 리스트)
          const recipeImagesText = row[EXCEL_COLUMNS.RECIPE_IMAGE.IMAGES] || '';
          const recipeImageUrls =
            RecipeImageParserUtil.parseRecipeImages(recipeImagesText || '') ||
            [];

          // Step 이미지 파싱 (동적으로 처리: 1step 이미지, 2step 이미지, ...)
          const stepImageMap = RecipeImageParserUtil.parseStepImages(row);

          // 이미지가 하나도 없는 행은 스킵 (데이터가 없는 빈 행)
          if (recipeImageUrls.length === 0 && stepImageMap.size === 0) {
            this.logger.log(
              `행 ${rowNumber}: 레시피 ID ${recipeId}는 이미지 데이터가 없어 스킵합니다.`,
            );
            continue;
          }

          // 트랜잭션으로 이미지 업데이트
          await this.updateRecipeImages(
            recipeId,
            recipeImageUrls,
            stepImageMap,
          );

          updatedRecipeCount++;
          this.logger.log(
            `레시피 ${recipeId} 이미지 업데이트 완료: ${recipe.title}`,
          );
        } catch (error) {
          // 에러 발생 시 처리
          const errorMessage = error?.message || '알 수 없는 오류';
          if (
            !errors.some(
              (e) => e && e.row === rowNumber && e.error === errorMessage,
            )
          ) {
            const recipeId = RecipeImageParserUtil.parseRecipeId(row);
            errors.push({
              row: rowNumber,
              title: recipeId ? `레시피 ID: ${recipeId}` : '(제목 없음)',
              error: errorMessage,
            });
          }
          skippedRows.push({ row, rowNumber });
          skippedRecipeCount++;
          this.logger.error(`행 ${rowNumber} 처리 실패`, error);
        }
      }

      // 임포트 완료 로그
      this.logger.log(
        `총 ${updatedRecipeCount}개의 레시피 이미지가 업데이트되었습니다.`,
      );
      this.logger.log(`${skippedRecipeCount}개의 레시피가 건너뛰었습니다.`);

      // 스킵된 데이터가 있으면 엑셀 파일 생성
      let skippedExcelBuffer: Buffer | null = null;
      let skippedFileName: string | null = null;

      // undefined 값 제거
      const validErrors = errors.filter((err) => err != null);

      if (skippedRows.length > 0) {
        // 스킵된 레시피 데이터를 엑셀 파일로 변환
        skippedExcelBuffer = this.createSkippedRecipeImageExcel(
          skippedRows,
          validErrors,
        );
        // 타임스탬프를 포함한 파일명 생성
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        skippedFileName = `skipped_recipe_images_${timestamp}.xlsx`;
      }

      // 임포트 결과 반환
      return {
        updatedRecipeCount,
        skippedRecipeCount,
        errors: validErrors,
        skippedExcelBuffer,
        skippedFileName,
      };
    } catch (error) {
      // 전체 임포트 과정에서 예상치 못한 에러 발생 시
      this.logger.error('레시피 이미지 엑셀 파싱 중 오류 발생', error);
      throw new CustomException({
        code: ERROR_CODES.RECIPE_CREATE_FAILED.code,
        message: `레시피 이미지 엑셀 파싱 실패: ${error.message}`,
      });
    }
  }

  /**
   * 레시피 이미지를 업데이트합니다.
   * 레시피 본문 이미지가 제공된 경우에만 기존 이미지를 삭제하고 새로운 이미지를 추가합니다.
   * Step 이미지는 해당 step의 이미지만 업데이트합니다. (각 step마다 하나의 이미지만 등록 가능)
   *
   * @param recipeId 레시피 ID
   * @param recipeImageUrls 레시피 이미지 URL 배열 (쉼표로 구분된 여러 개의 이미지, 빈 배열이면 본문 이미지는 업데이트하지 않음)
   * @param stepImageMap Step 번호와 이미지 URL 맵 (각 step마다 하나의 이미지만)
   */
  @Transactional()
  private async updateRecipeImages(
    recipeId: number,
    recipeImageUrls: Array<{ imageUrl: string }>,
    stepImageMap: Map<number, string>,
  ): Promise<void> {
    // 레시피 본문 이미지 업데이트 (이미지가 제공된 경우에만)
    if (recipeImageUrls.length > 0) {
      // 기존 레시피 이미지 삭제
      await this.recipeImageRepository.delete({ recipeId });

      // 새로운 레시피 이미지 추가
      const recipeImages = recipeImageUrls.map((imageDto) =>
        this.recipeImageRepository.create({
          recipeId,
          imageUrl: imageDto.imageUrl,
        }),
      );
      await this.recipeImageRepository.save(recipeImages);
    }

    // Step 이미지 업데이트
    if (stepImageMap.size > 0) {
      for (const [stepNum, imageUrl] of stepImageMap.entries()) {
        const step = await this.recipeStepRepository.findOne({
          where: { recipeId, orderNum: stepNum },
        });

        if (step) {
          step.imageUrl = imageUrl;
          await this.recipeStepRepository.save(step);
        } else {
          this.logger.warn(
            `레시피 ${recipeId}의 ${stepNum}단계를 찾을 수 없습니다.`,
          );
        }
      }
    }
  }

  /**
   * 스킵된 레시피 이미지 데이터를 엑셀 파일로 변환합니다.
   * step 이미지 컬럼을 동적으로 찾아서 포함시킵니다.
   *
   * @param skippedRows 스킵된 레시피 행 데이터 배열
   * @param errors 각 행의 에러 정보 배열
   * @returns 생성된 엑셀 파일 버퍼 (스킵된 행이 없으면 null)
   */
  private createSkippedRecipeImageExcel(
    skippedRows: Array<{
      row: Record<string, any>;
      rowNumber: number;
    }>,
    errors: RecipeError[],
  ): Buffer | null {
    // 스킵된 행이 없으면 null 반환
    if (skippedRows.length === 0) {
      return null;
    }

    // 에러 정보를 행 번호로 매핑
    const errorMap = new Map<number, string>();
    errors.forEach((err) => {
      if (err && err.row !== undefined) {
        errorMap.set(err.row, err.error);
      }
    });

    // 모든 스킵된 행에서 컬럼명 수집 (step 이미지 컬럼 포함)
    const allColumns = new Set<string>();
    skippedRows.forEach((item) => {
      if (item && item.row) {
        Object.keys(item.row).forEach((key) => {
          allColumns.add(key);
        });
      }
    });

    // 기본 컬럼 순서 정의
    const baseColumns = [
      EXCEL_COLUMNS.RECIPE_IMAGE.ID,
      EXCEL_COLUMNS.RECIPE_IMAGE.IMAGES,
    ];

    // step 이미지 컬럼만 추출하여 정렬
    const stepImageColumns = Array.from(allColumns)
      .filter((col) => /^\d+step\s*이미지$/.test(col))
      .sort((a, b) => {
        // 컬럼명에서 숫자 추출하여 단계 번호로 정렬
        const numA = parseInt(a.match(/^(\d+)/)?.[1] || '0', 10);
        const numB = parseInt(b.match(/^(\d+)/)?.[1] || '0', 10);
        return numA - numB;
      });

    // 스킵 이유를 포함한 데이터 준비
    const data = skippedRows
      .filter((item) => item && item.row)
      .map((item) => {
        const row = item.row;
        const rowNumber = item.rowNumber;
        const error = errorMap.get(rowNumber) || '';

        const rowData: Record<string, any> = {};
        // 기본 컬럼 추가
        for (const col of baseColumns) {
          rowData[col] = row[col] || '';
        }
        // step 이미지 컬럼 추가
        for (const col of stepImageColumns) {
          rowData[col] = row[col] || '';
        }
        // 스킵 이유 추가
        rowData[EXCEL_SHEET_NAME.SKIP_REASON_COLUMN] = error;

        return rowData;
      });

    // 엑셀 파일 생성
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, EXCEL_SHEET_NAME.SKIPPED);

    // 버퍼로 변환하여 반환
    return Buffer.from(
      XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }),
    );
  }
}
