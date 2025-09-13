import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Condition } from '@/database/entity/condition.entity';
import { GetConditionsResponseDto } from './dto/get-conditions.dto';
import {
  CreateConditionDtoTx,
  ConditionResponseDto,
} from './dto/create-condition.dto';
import { CustomException } from '@/common/exceptions/custom-exception';
import { ERROR_CODES } from '@/common/constants/error-codes';

@Injectable()
export class ConditionService {
  private readonly logger = new Logger(ConditionService.name);

  constructor(
    @InjectRepository(Condition)
    private readonly conditionRepository: Repository<Condition>,
  ) {}

  /**
   * 컨디션 목록 조회
   */
  async getConditions(): Promise<GetConditionsResponseDto> {
    try {
      const conditions = await this.conditionRepository.find({
        order: {
          id: 'ASC',
        },
      });

      return {
        conditions: conditions.map((condition) => ({
          id: condition.id,
          name: condition.name,
        })),
      };
    } catch (error) {
      this.logger.error('컨디션 목록 조회 중 에러 발생', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * 컨디션 생성
   */
  async createCondition(
    dto: CreateConditionDtoTx,
  ): Promise<ConditionResponseDto[]> {
    const incomingNames = dto.data.map((element) => element.name);

    // 중복 컨디션 이름 체크
    const existingConditions = await this.conditionRepository.find({
      where: {
        name: In(incomingNames),
      },
    });

    if (existingConditions.length > 0) {
      throw new CustomException(ERROR_CODES.CONDITION_ALREADY_EXISTS);
    }

    const newConditions = this.conditionRepository.create(dto.data);
    const savedConditions = await this.conditionRepository.save(newConditions);

    return savedConditions.map((condition) => ({
      id: condition.id,
      name: condition.name,
      created_at: condition.created_at,
      updated_at: condition.updated_at,
    }));
  }
}
