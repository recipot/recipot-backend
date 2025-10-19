import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeasurementGuideService } from './measurement-guide.service';
import { MeasurementGuideController } from './measurement-guide.controller';
import { MeasurementGuide } from '@/database/entity/measurement-guide.entity';
import { CommonCode } from '@/database/entity/common-code.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MeasurementGuide, CommonCode])],
  controllers: [MeasurementGuideController],
  providers: [MeasurementGuideService],
  exports: [MeasurementGuideService],
})
export class MeasurementGuideModule {}
