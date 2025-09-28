import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserCompletedRecipe } from '@/database/entity/user-completed-recipe.entity';
import { HealthSurveyController } from './health-survey.controller';
import { HealthSurveyService } from './health-survey.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserCompletedRecipe])],
  controllers: [HealthSurveyController],
  providers: [HealthSurveyService],
  exports: [HealthSurveyService],
})
export class HealthSurveyModule {}
