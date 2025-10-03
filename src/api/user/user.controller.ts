import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '@/api/auth/decorators/auth.decorators';
import { JwtGuard } from '@/api/auth/guards/auth.guard';
import { ERROR_CODES } from '@/common/constants/error-codes';
import { ApiErrorResponse } from '@/common/decorators/api-error-response.decorator';
import { ApiSuccessResponse } from '@/common/decorators/api-success-response.decorator';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { GroupedBookmarksDto } from './dto/grouped-bookmarks.dto';
import {
  SaveUserIngredientsSurveyDto,
  SaveUserIngredientsSurveyResponseDto,
} from './dto/save-user-ingredients-survey.dto';
import { UserService } from './user.service';

@Controller({ path: 'user', version: '1' })
@ApiTags('User')
@UseGuards(JwtGuard)
@ApiBearerAuth('Authorization')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * @description 인증된 사용자의 북마크를 날짜별로 그룹핑하여 조회합니다.
   */
  @Get('/bookmarks')
  @ApiOperation({
    summary: '북마크 목록 조회 (날짜별 그룹핑)',
    description: '인증된 사용자의 북마크를 날짜별로 그룹핑하여 조회합니다.',
  })
  @ApiSuccessResponse('북마크 목록 조회 성공', [GroupedBookmarksDto])
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, ERROR_CODES.AUTH_REQUIRED)
  @ApiErrorResponse(HttpStatus.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND)
  async getBookmarksByDate(
    @Request() req: any,
  ): Promise<GroupedBookmarksDto[]> {
    const userId = req.user.sub;
    return await this.userService.getBookmarksByDate(userId);
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
  @Delete('/bookmarks/:recipeId')
  @ApiOperation({
    summary: '레시피 북마크 해제',
    description: '인증된 사용자가 레시피 북마크를 해제합니다.',
  })
  @ApiSuccessResponse('레시피 북마크 해제 성공', {
    type: 'boolean',
    example: true,
  })
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, ERROR_CODES.AUTH_REQUIRED)
  @ApiErrorResponse(HttpStatus.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND)
  @ApiErrorResponse(HttpStatus.NOT_FOUND, ERROR_CODES.BOOKMARK_NOT_FOUND)
  async deleteBookmark(
    @Request() req: any,
    @Param('recipeId', ParseIntPipe) recipeId: number,
  ): Promise<boolean> {
    const userId = req.user.sub;
    return await this.userService.deleteBookmark(userId, recipeId);
  }

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
  @Get('/:id')
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

  @Post('recent-recipes/:recipeId')
  @ApiOperation({
    summary: '최근 본 레시피 추가',
    description: '레시피 ID를 받아서 최근 본 레시피 목록에 추가합니다.',
  })
  @ApiSuccessResponse('최근 본 레시피 추가 성공', {
    type: 'boolean',
    example: true,
  })
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, ERROR_CODES.AUTH_REQUIRED)
  async addRecentRecipe(
    @Request() req: any,
    @Param('recipeId', ParseIntPipe) recipeId: number,
  ): Promise<boolean> {
    const userId = req.user.sub;
    return this.userService.addRecentRecipe(userId, recipeId);
  }

  @Get('recent-recipes')
  @ApiOperation({
    summary: '최근 본 레시피 목록 조회',
    description: '현재 유저의 최근 본 레시피 목록을 조회합니다.',
  })
  @ApiSuccessResponse('최근 본 레시피 목록 조회 성공', { type: 'array' })
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, ERROR_CODES.AUTH_REQUIRED)
  async getRecentRecipes(): Promise<any> {
    // TODO
  }
}
