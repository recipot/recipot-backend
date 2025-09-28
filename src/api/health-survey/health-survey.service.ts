import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';

import { UserCompletedRecipe } from '@/database/entity/user-completed-recipe.entity';
import { HealthSurveyEligibilityResponseDto } from './dto/check-health-survey-eligibility.dto';
import { CommonCode } from '@/database/entity/common-code.entity';
import {
  GetHealthSurveyPreparationResponseDto,
  HealthSurveyCodeOptionDto,
} from './dto/get-health-survey-preparation.dto';
import { UserHealthSurvey } from '@/database/entity/user-health-survey.entity';

@Injectable()
export class HealthSurveyService {
  constructor(
    @InjectRepository(UserCompletedRecipe)
    private readonly userCompletedRecipeRepository: Repository<UserCompletedRecipe>,
    @InjectRepository(UserHealthSurvey)
    private readonly userHealthSurveyRepository: Repository<UserHealthSurvey>,
    @InjectRepository(CommonCode)
    private readonly commonCodeRepository: Repository<CommonCode>,
  ) {}

  async getEligibility(
    userId: number,
  ): Promise<HealthSurveyEligibilityResponseDto> {
    const { start: lastWeekStart, end: lastWeekEnd } = this.getWeekRange(-1);
    const { start: thisWeekStart, end: thisWeekEnd } = this.getWeekRange(0);

    const [completionCount, hasSubmittedThisWeek] = await Promise.all([
      this.userCompletedRecipeRepository.count({
        where: {
          userId,
          isCompleted: true,
          updatedAt: Between(lastWeekStart, lastWeekEnd),
        },
      }),
      this.userHealthSurveyRepository.exist({
        where: {
          userId,
          createdAt: Between(thisWeekStart, thisWeekEnd),
        },
      }),
    ]);

    return {
      isEligible: completionCount > 0 && !hasSubmittedThisWeek,
      recentCompletionCount: completionCount,
    };
  }

  async getPreparationData(): Promise<GetHealthSurveyPreparationResponseDto> {
    const [persistentIssueCodes, effectCodes] = await Promise.all([
      this.commonCodeRepository.find({
        where: { groupCode: 'H01', isActive: true },
        order: { orderNum: 'ASC' },
      }),
      this.commonCodeRepository.find({
        where: { groupCode: 'H02', isActive: true },
        order: { orderNum: 'ASC' },
      }),
    ]);

    return {
      persistentIssueOption: this.mapToCodeOptions(persistentIssueCodes),
      effectOptions: this.mapToCodeOptions(effectCodes),
    };
  }

  /**
   * 기준 주차의 월요일 00:00:00 ~ 일요일 23:59:59.999 범위를 반환합니다.
   * @param diff 0이면 이번 주, -1이면 지난 주, 1이면 다음 주
   */
  private getWeekRange(diff: number): { start: Date; end: Date } {
    const now = new Date();
    const today = now.getDay() === 0 ? 7 : now.getDay(); // 일요일=0 보정
    const startOfThisWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - (today - 1),
    );
    startOfThisWeek.setHours(0, 0, 0, 0);

    const start = new Date(startOfThisWeek);
    start.setDate(start.getDate() + diff * 7);

    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    end.setMilliseconds(end.getMilliseconds() - 1);

    return { start, end };
  }

  private mapToCodeOption(code: CommonCode): HealthSurveyCodeOptionDto {
    return { code: code.code, codeName: code.codeName };
  }

  private mapToCodeOptions(codes: CommonCode[]): HealthSurveyCodeOptionDto[] {
    return codes.map((code) => this.mapToCodeOption(code));
  }
}
