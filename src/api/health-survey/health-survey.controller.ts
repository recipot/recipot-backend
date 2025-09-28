import {
  Controller,
  Get,
  HttpStatus,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtGuard } from '@/api/auth/guards/auth.guard';
import { ERROR_CODES } from '@/common/constants/error-codes';
import { ApiErrorResponse } from '@/common/decorators/api-error-response.decorator';
import { ApiSuccessResponse } from '@/common/decorators/api-success-response.decorator';
import { HealthSurveyService } from './health-survey.service';
import { HealthSurveyEligibilityResponseDto } from './dto/check-health-survey-eligibility.dto';
import { GetHealthSurveyPreparationResponseDto } from './dto/get-health-survey-preparation.dto';

@ApiTags('Health Survey')
@Controller({ path: 'health-survey', version: '1' })
@UseGuards(JwtGuard)
@ApiBearerAuth('Authorization')
export class HealthSurveyController {
  constructor(private readonly healthSurveyService: HealthSurveyService) {}

  @Get('eligibility')
  @ApiOperation({
    summary: '건강 설문 작성 가능 여부 확인',
    description:
      '지난 주에 레시피를 완료한 이력이 있는지 확인해 건강 설문 작성 가능 여부를 반환합니다.',
  })
  @ApiSuccessResponse('건강 설문 가능 여부 조회 성공', {
    type: HealthSurveyEligibilityResponseDto,
  })
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, ERROR_CODES.AUTH_REQUIRED)
  @ApiErrorResponse(HttpStatus.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND)
  async checkEligibility(
    @Request() req: any,
  ): Promise<HealthSurveyEligibilityResponseDto> {
    const userId = req.user.sub;
    return this.healthSurveyService.getEligibility(userId);
  }

  @Get('preparation')
  @ApiOperation({
    summary: '건강 설문 작성에 필요한 데이터 조회',
    description:
      '건강 설문 작성 시 필요한 평소 건강 문제(H01, 단일)와 느낀 변화(H02, 복수) 코드 옵션을 반환합니다.',
  })
  @ApiSuccessResponse('건강 설문 준비 데이터 조회 성공', {
    type: GetHealthSurveyPreparationResponseDto,
  })
  async getPreparation(): Promise<GetHealthSurveyPreparationResponseDto> {
    return this.healthSurveyService.getPreparationData();
  }
}
