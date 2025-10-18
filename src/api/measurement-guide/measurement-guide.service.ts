import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeasurementGuide } from '@/database/entity/measurement-guide.entity';

@Injectable()
export class MeasurementGuideService {
  private readonly logger = new Logger(MeasurementGuideService.name);

  constructor(
    @InjectRepository(MeasurementGuide)
    private readonly measurementGuideRepository: Repository<MeasurementGuide>,
  ) {}

  /**
   * 계량 가이드 생성
   */
}
