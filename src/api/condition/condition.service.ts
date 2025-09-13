import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Condition } from '@/database/entity/condition.entity';
import { GetConditionsResponseDto } from './dto/get-conditions.dto';

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
}
