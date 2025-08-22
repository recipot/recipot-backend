import { CommonCode } from '@/database/entity/common-code.entity';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateCommonCodeDto } from './dto/creeate-comon-code.dto';
import { ERROR_CODES } from '@/common/constants/error-codes';

@Injectable()
export class CommonCodeService {
  private readonly logger = new Logger(CommonCodeService.name);

  constructor(
    @InjectRepository(CommonCode)
    private readonly commonCodeRepository: Repository<CommonCode>,
  ) {}

  /**
   * 공통 코드 생성
   */
  async createCommonCode(dto: CreateCommonCodeDto[]): Promise<CommonCode[]> {
    const codesToCheck = dto.map((dto) => dto.code);
    if (codesToCheck.length === 0) {
      return [];
    }

    const existingCodes = await this.commonCodeRepository.find({
      where: {
        code: In(codesToCheck),
      },
    });

    if (existingCodes.length > 0) {
      throw new BadRequestException(
        ERROR_CODES.COMMON_CODE_ALREADY_EXISTS.message,
      );
    }

    const newCommonCodes = this.commonCodeRepository.create(dto);
    return await this.commonCodeRepository.save(newCommonCodes);
  }
}
