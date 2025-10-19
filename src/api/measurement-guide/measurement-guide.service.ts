import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MeasurementGuide } from '@/database/entity/measurement-guide.entity';
import {
  CreateMeasurementGuideRequestDto,
  MeasurementGuideResponseDto,
} from './dto/create-measurement-guide.dto';
import { CommonCode } from '@/database/entity/common-code.entity';
import { CustomException } from '@/common/exceptions/custom-exception';
import { ERROR_CODES } from '@/common/constants/error-codes';
import {
  GetMeasurementGuidesResponseDto,
  MeasurementGuideDetailDto,
} from './dto/get-measurement-guide.dto';

@Injectable()
export class MeasurementGuideService {
  private readonly logger = new Logger(MeasurementGuideService.name);

  constructor(
    @InjectRepository(MeasurementGuide)
    private readonly measurementGuideRepository: Repository<MeasurementGuide>,
    @InjectRepository(CommonCode)
    private readonly commonCodeRepository: Repository<CommonCode>,
  ) {}

  /**
   * 계량 가이드 생성
   */
  async createMeasurementGuide(
    dto: CreateMeasurementGuideRequestDto,
  ): Promise<MeasurementGuideResponseDto[]> {
    const categoryCodes = [
      ...new Set(dto.data.map((element) => element.categoryCode)),
    ];
    const validCategoryCodes = await this.commonCodeRepository.find({
      where: { code: In(categoryCodes) },
    });
    if (validCategoryCodes.length !== categoryCodes.length) {
      this.logger.error(`유효하지 않은 카테고리 코드: ${categoryCodes}`);
      throw new CustomException(ERROR_CODES.COMMON_CODE_NOT_FOUND);
    }
    const existingGuides = await this.measurementGuideRepository.find({
      where: dto.data.map((element) => ({
        categoryCode: element.categoryCode,
        standard: element.standard,
      })),
    });
    if (existingGuides.length > 0) {
      this.logger.error(
        `이미 존재하는 계량 가이드: ${existingGuides.length}개`,
      );
      throw new CustomException(ERROR_CODES.MEASUREMENT_GUIDE_ALREADY_EXISTS);
    }
    const newGuides = this.measurementGuideRepository.create(dto.data);
    const savedGuides = await this.measurementGuideRepository.save(newGuides);
    return savedGuides.map((guide) => ({
      id: guide.id,
      categoryCode: guide.categoryCode,
      standard: guide.standard,
      imageUrl: guide.imageUrl,
      description: guide.description,
      createdAt: guide.createdAt,
      updatedAt: guide.updatedAt,
    }));
  }

  /**
   * 계량 가이드 조회
   */
  async getMeasurementGuides(): Promise<GetMeasurementGuidesResponseDto> {
    const guides = await this.measurementGuideRepository.find({
      order: { categoryCode: 'ASC', id: 'ASC' },
    });
    if (guides.length === 0) {
      throw new CustomException(ERROR_CODES.MEASUREMENT_GUIDE_NOT_FOUND);
    }
    const categoryCodes = [
      ...new Set(guides.map((guide) => guide.categoryCode)),
    ];
    const commonCodes = await this.commonCodeRepository.find({
      where: { code: In(categoryCodes) },
    });
    const codeNameMap = new Map(
      commonCodes.map((code) => [code.code, code.codeName]),
    );
    const groupedData: {
      [categoryCodeName: string]: MeasurementGuideDetailDto[];
    } = {};

    for (const guide of guides) {
      const categoryCodeName = codeNameMap.get(guide.categoryCode);

      if (!groupedData[categoryCodeName]) {
        groupedData[categoryCodeName] = [];
      }

      groupedData[categoryCodeName].push({
        standard: guide.standard,
        imageUrl: guide.imageUrl,
        description: guide.description,
      });
    }
    return { data: groupedData };
  }
}
