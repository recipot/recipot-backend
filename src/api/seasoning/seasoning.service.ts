import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Seasoning } from '@/database/entity/seasoning.entity';
import { CustomException } from '@/common/exceptions/custom-exception';
import { ERROR_CODES } from '@/common/constants/error-codes';
import {
  CreateSeasoningDtoTx,
  SeasoningResponseDto,
} from './dto/create-seasoning.dto';
import {
  GetAdminSeasoningsDto,
  GetAdminSeasoningsResponseDto,
} from './dto/get-admin-seasonings.dto';
import {
  DeleteAdminSeasoningsDto,
  DeleteAdminSeasoningsResponseDto,
} from './dto/delete-admin-seasonings.dto';

@Injectable()
export class SeasoningService {
  private readonly logger = new Logger(SeasoningService.name);

  constructor(
    @InjectRepository(Seasoning)
    private readonly seasoningRepository: Repository<Seasoning>,
  ) {}

  /**
   * 양념 생성
   */
  async createSeasoning(
    dto: CreateSeasoningDtoTx,
  ): Promise<SeasoningResponseDto[]> {
    const incomingNames = dto.data.map((element) => element.name);

    const existingSeasonings = await this.seasoningRepository.find({
      where: {
        name: In(incomingNames),
      },
    });

    if (existingSeasonings.length > 0) {
      throw new CustomException(ERROR_CODES.SEASONING_ALREADY_EXISTS);
    }

    const newSeasonings = this.seasoningRepository.create(dto.data);
    const savedSeasonings = await this.seasoningRepository.save(newSeasonings);

    return savedSeasonings.map((seasoning) => ({
      id: seasoning.id,
      name: seasoning.name,
    }));
  }

  /**
   * [어드민] 양념 목록 조회 (페이지네이션)
   */
  async getAdminSeasonings(
    query: GetAdminSeasoningsDto,
  ): Promise<GetAdminSeasoningsResponseDto> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [seasonings, total] = await this.seasoningRepository.findAndCount({
      order: { id: 'ASC' },
      take: limit,
      skip: skip,
    });

    return {
      data: seasonings.map((seasoning) => ({
        id: seasoning.id,
        name: seasoning.name,
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * [어드민] 양념 다중 삭제
   */
  async deleteAdminSeasonings(
    dto: DeleteAdminSeasoningsDto,
  ): Promise<DeleteAdminSeasoningsResponseDto> {
    // 존재하는 양념 확인
    const existingSeasonings = await this.seasoningRepository.find({
      where: { id: In(dto.ids) },
      select: ['id'],
    });

    const existingIds = existingSeasonings.map((s) => s.id);
    const notFoundIds = dto.ids.filter((id) => !existingIds.includes(id));

    // 존재하지 않는 ID가 있으면 에러
    if (notFoundIds.length > 0) {
      throw new CustomException(ERROR_CODES.SEASONING_NOT_FOUND);
    }

    const result = await this.seasoningRepository.softDelete({
      id: In(dto.ids),
    });

    return {
      deletedCount: result.affected || 0,
    };
  }
}
