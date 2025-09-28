import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';

import { UserCompletedRecipe } from '@/database/entity/user-completed-recipe.entity';
import { HealthSurveyEligibilityResponseDto } from './dto/check-health-survey-eligibility.dto';

@Injectable()
export class HealthSurveyService {
  constructor(
    @InjectRepository(UserCompletedRecipe)
    private readonly userCompletedRecipeRepository: Repository<UserCompletedRecipe>,
  ) {}

  async getEligibility(
    userId: number,
  ): Promise<HealthSurveyEligibilityResponseDto> {
    const { start, end } = this.getLastWeekRange();

    const completionCount = await this.userCompletedRecipeRepository.count({
      where: {
        userId,
        isCompleted: true,
        updatedAt: Between(start, end),
      },
    });

    return {
      isEligible: completionCount > 0,
      recentCompletionCount: completionCount,
    };
  }

  /**
   * 지난 주(월요일 00:00:00 ~ 일요일 23:59:59.999) 범위를 반환합니다.
   */
  private getLastWeekRange(): { start: Date; end: Date } {
    const now = new Date();

    // getDay(): 일요일=0, 월요일=1 … 토요일=6
    const today = now.getDay() === 0 ? 7 : now.getDay();
    const startOfThisWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - (today - 1),
    );
    startOfThisWeek.setHours(0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    const endOfLastWeek = new Date(startOfThisWeek.getTime() - 1);

    return { start: startOfLastWeek, end: endOfLastWeek };
  }
}
