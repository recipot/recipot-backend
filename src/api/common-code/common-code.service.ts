import { CommonCode } from '@/database/entity/common-code.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateCommonCodeDtoTx } from './dto/create-common-code.dto';
import { ERROR_CODES } from '@/common/constants/error-codes';
import { PageQueryDto } from '@/common/dto/pagination.dto';
import { UpdateCommonCodeDto } from './dto/update-common-code.dto';
import { CustomException } from '@/common/exceptions/custom-exception';

@Injectable()
export class CommonCodeService {
  private readonly logger = new Logger(CommonCodeService.name);

  constructor(
    @InjectRepository(CommonCode)
    private readonly commonCodeRepository: Repository<CommonCode>,
  ) {}

  /**
   * 공통 코드 페이지네이션 조회
   */
  async findCommonCodes(query: PageQueryDto): Promise<CommonCode[]> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const data = await this.commonCodeRepository.find({
      order: {
        groupCode: 'ASC',
        orderNum: 'ASC',
      },
      take: limit,
      skip: skip,
    });

    return data;
  }

  /**
   * 공통 코드 조회 (내부 서비스용)
   */
  async findCommonCode(code: string): Promise<CommonCode> {
    const commonCode = await this.commonCodeRepository.findOneBy({ code });

    if (!commonCode) {
      throw new CustomException(ERROR_CODES.COMMON_CODE_NOT_FOUND);
    }

    return commonCode;
  }

  /**
   * 공통 코드 생성
   */
  async createCommonCode(dto: CreateCommonCodeDtoTx): Promise<CommonCode[]> {
    const incomingCodes = dto.data.map((element) => element.code);

    const existingCodes = await this.commonCodeRepository.find({
      where: {
        code: In(incomingCodes),
      },
    });

    if (existingCodes.length > 0) {
      throw new CustomException(ERROR_CODES.COMMON_CODE_ALREADY_EXISTS);
    }

    const newCommonCodes = this.commonCodeRepository.create(dto.data);
    return await this.commonCodeRepository.save(newCommonCodes);
  }

  /**
   * 공통 코드 수정
   */
  async updateCommonCode(
    id: number,
    dto: UpdateCommonCodeDto,
  ): Promise<CommonCode> {
    const codeToUpdate = await this.commonCodeRepository.preload({
      id: id,
      ...dto,
    });

    if (!codeToUpdate) {
      throw new CustomException(ERROR_CODES.COMMON_CODE_NOT_FOUND);
    }

    return await this.commonCodeRepository.save(codeToUpdate);
  }

  /**
   * 공통 코드 삭제
   */
  async deleteCommonCode(id: number): Promise<CommonCode> {
    const codeToRemove = await this.commonCodeRepository.findOneBy({ id });

    if (!codeToRemove) {
      throw new CustomException(ERROR_CODES.COMMON_CODE_NOT_FOUND);
    }

    codeToRemove.isActive = false;

    return await this.commonCodeRepository.softRemove(codeToRemove);
  }
}
