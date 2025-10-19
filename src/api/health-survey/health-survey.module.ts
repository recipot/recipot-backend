import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserCompletedRecipe } from '@/database/entity/user-completed-recipe.entity';
import { HealthSurveyController } from './health-survey.controller';
import { HealthSurveyService } from './health-survey.service';
import { CommonCode } from '@/database/entity/common-code.entity';
import { UserHealthSurvey } from '@/database/entity/user-health-survey.entity';
import { UserHealthSurveyEffect } from '@/database/entity/user-health-survey-effect.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserCompletedRecipe,
      CommonCode,
      UserHealthSurvey,
      UserHealthSurveyEffect,
    ]),
  ],
  controllers: [HealthSurveyController],
  providers: [HealthSurveyService],
  exports: [HealthSurveyService],
})
export class HealthSurveyModule {}
