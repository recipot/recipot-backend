import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeasoningService } from './seasoning.service';
import { SeasoningController } from './seasoning.controller';
import { Seasoning } from '@/database/entity/seasoning.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Seasoning])],
  controllers: [SeasoningController],
  providers: [SeasoningService],
  exports: [SeasoningService],
})
export class SeasoningModule {}
