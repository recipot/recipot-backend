import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConditionController } from './condition.controller';
import { ConditionService } from './condition.service';
import { Condition } from '@/database/entity/condition.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Condition])],
  controllers: [ConditionController],
  providers: [ConditionService],
  exports: [ConditionService],
})
export class ConditionModule {}
