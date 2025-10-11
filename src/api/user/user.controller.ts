import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { Public } from '@/api/auth/decorators/auth.decorators';
import { JwtGuard } from '@/api/auth/guards/auth.guard';
import { ERROR_CODES } from '@/common/constants/error-codes';
import { ApiErrorResponse } from '@/common/decorators/api-error-response.decorator';
import { ApiSuccessResponse } from '@/common/decorators/api-success-response.decorator';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { GetBookmarksRequestDto } from './dto/get-bookmarks-request.dto';
import { GetBookmarksResponseDto } from './dto/get-bookmarks-response.dto';
// moved to UserRecipeArchiveController
import {
  SaveUserIngredientsSurveyDto,
  SaveUserIngredientsSurveyResponseDto,
} from './dto/save-user-ingredients-survey.dto';
import { UserService } from './user.service';
import { CustomException } from '@/common/exceptions/custom-exception';
import { MyPageSummaryDto } from '@/api/user/dto/my-page.dto';

@Controller({ path: 'users', version: '1' })
@ApiTags('User')
@UseGuards(JwtGuard)
@ApiBearerAuth('Authorization')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * @description 인증된 사용자의 북마크를 페이지네이션으로 조회합니다.
   */
  @Get('/bookmarks')
  @ApiOperation({
    summary: '북마크 목록 조회 (페이지네이션)',
    description: '인증된 사용자의 북마크를 페이지네이션으로 조회합니다.',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    description: '페이지 번호 (기본값: 1)',
    example: 1,
  })
  @ApiSuccessResponse('북마크 목록 조회 성공', GetBookmarksResponseDto)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, ERROR_CODES.AUTH_REQUIRED)
  @ApiErrorResponse(HttpStatus.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND)
  async getBookmarks(
    @Request() req: any,
    @Query() query: GetBookmarksRequestDto,
  ): Promise<GetBookmarksResponseDto> {
    const userId = req.user.sub;
    return await this.userService.getBookmarks(userId, query);
  }

  /**
   * @description 레시피를 북마크합니다.
   */
  @Post('/bookmarks')
  @ApiOperation({
    summary: '레시피 북마크',
    description: '인증된 사용자가 레시피를 북마크합니다.',
  })
  @ApiSuccessResponse('레시피 북마크 성공', { type: 'boolean', example: true })
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, ERROR_CODES.AUTH_REQUIRED)
  @ApiErrorResponse(HttpStatus.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND)
  @ApiErrorResponse(HttpStatus.CONFLICT, ERROR_CODES.BOOKMARK_ALREADY_EXISTS)
  async createBookmark(
    @Request() req: any,
    @Body() createBookmarkDto: CreateBookmarkDto,
  ): Promise<boolean> {
    const userId = req.user.sub;
    return await this.userService.createBookmark(userId, createBookmarkDto);
  }

  /**
   * @description 레시피 북마크를 해제합니다.
   */
  // moved to UserRecipeArchiveController

  /**
   * @description 사용자의 보유 재료 설문을 저장합니다.
   */
  @Post('/ingredients-survey')
  @ApiOperation({
    summary: '보유 재료 설문 저장',
    description: '사용자가 보유한 재료 ID 목록을 캐시에 저장합니다.',
  })
  @ApiSuccessResponse(
    '보유 재료 설문 저장 성공',
    SaveUserIngredientsSurveyResponseDto,
  )
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, ERROR_CODES.AUTH_REQUIRED)
  @ApiErrorResponse(HttpStatus.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND)
  async saveIngredientsSurvey(
    @Request() req: any,
    @Body() surveyDto: SaveUserIngredientsSurveyDto,
  ): Promise<SaveUserIngredientsSurveyResponseDto> {
    const userId = req.user.sub;
    return await this.userService.saveUserIngredientsSurvey(userId, surveyDto);
  }

  /**
   * @description 인증된 사용자의 프로필을 조회한다.
   */
  @Get('/profile/me')
  @ApiOperation({
    summary: '인증된 사용자의 프로필 조회',
    description: 'JWT 토큰을 통해 인증된 현재 사용자의 프로필을 조회합니다.',
  })
  @ApiSuccessResponse('프로필 조회 성공', {
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      email: { type: 'string', example: 'user@example.com' },
      name: { type: 'string', example: '홍길동' },
    },
  })
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, ERROR_CODES.AUTH_REQUIRED)
  @ApiErrorResponse(HttpStatus.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND)
  async getMyProfile(@Request() req: any) {
    // JWT 가드를 통해 인증된 사용자 정보는 req.user에 자동으로 설정됨
    const userId = req.user.sub;
    return await this.userService.findById(userId);
  }

  /**
   * @description 인증된 사용자의 프로필을 업데이트한다.
   */
  @Get('/profile/update')
  @ApiOperation({
    summary: '인증된 사용자의 프로필 업데이트',
    description:
      'JWT 토큰을 통해 인증된 현재 사용자의 프로필을 업데이트합니다.',
  })
  @ApiSuccessResponse('프로필 업데이트 성공')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, ERROR_CODES.AUTH_REQUIRED)
  async updateMyProfile(@Request() req: any) {
    // JWT 가드를 통해 인증된 사용자 정보는 req.user에 자동으로 설정됨
    const userId = req.user.sub;
    return {
      message: '프로필 업데이트 기능은 추후 구현 예정',
      userId: userId,
      user: req.user,
    };
  }

  /**
   * @description 유저를 상세조회한다.
   */
  @Get(':id')
  @Public()
  @ApiOperation({ summary: '유저를 상세조회한다.' })
  @ApiSuccessResponse('유저 상세조회 성공', {
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      email: { type: 'string', example: 'user@example.com' },
      name: { type: 'string', example: '홍길동' },
    },
  })
  @ApiErrorResponse(HttpStatus.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND)
  async getUser(@Param('id', ParseIntPipe) id: number) {
    return await this.userService.findById(id);
  }

  /**
   * @description 마이페이지 메인 요약 (프로필/카운트 + saved/recent/unavailable preview)
   */
  @Get('/mypage/summary')
  @ApiOperation({ summary: '마이페이지 메인 요약' })
  @ApiSuccessResponse('마이페이지 요약 조회 성공', MyPageSummaryDto)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, ERROR_CODES.AUTH_REQUIRED)
  @ApiErrorResponse(HttpStatus.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND)
  async getMyPageSummary(@Request() req: any): Promise<MyPageSummaryDto> {
    const userId = Number(req.user?.sub);
    if (!userId) throw new CustomException(ERROR_CODES.AUTH_REQUIRED);
    return await this.userService.getMyPageSummary(userId);
  }

  /**
   * @description 못 먹는 음식 목록 (페이지네이션)
   */
  @Get('/ingredients/unavailable')
  @ApiOperation({ summary: '못 먹는 음식 목록 조회' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
  @ApiSuccessResponse('못 먹는 음식 목록 조회 성공', {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 3 },
        name: { type: 'string', example: '게' },
        categoryName: { type: 'string', example: '해산물류' },
      },
    },
  })
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, ERROR_CODES.AUTH_REQUIRED)
  async listUnavailableIngredients(
    @Request() req: any,
    @Query('limit') limit = 20,
    @Query('offset') offset = 0,
  ) {
    const userId = Number(req.user?.sub);
    if (!userId) throw new CustomException(ERROR_CODES.AUTH_REQUIRED);
    return await this.userService.getUnavailableIngredients(
      userId,
      Number(limit),
      Number(offset),
    );
  }
}
