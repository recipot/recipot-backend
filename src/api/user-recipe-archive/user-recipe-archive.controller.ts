import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtGuard } from '@/api/auth/guards/auth.guard';
import { UserRecipeArchiveService } from '@/api/user-recipe-archive/user-recipe-archive.service';
import { CreateBookmarkDto } from '@/api/user/dto/create-bookmark.dto';
import { GetBookmarksRequestDto } from '@/api/user/dto/get-bookmarks-request.dto';
import { GetBookmarksResponseDto } from '@/api/user/dto/get-bookmarks-response.dto';
import { GetCompletedRecipesRequestDto } from '@/api/user/dto/get-completed-recipes-request.dto';
import { GetCompletedRecipesResponseDto } from '@/api/user/dto/get-completed-recipes-response.dto';
import { GetRecentRecipesRequestDto } from '@/api/user/dto/get-recent-recipes-request.dto';
import { GetRecentRecipesResponseDto } from '@/api/user/dto/get-recent-recipes-response.dto';
import { ERROR_CODES } from '@/common/constants/error-codes';
import { ApiErrorResponse } from '@/common/decorators/api-error-response.decorator';
import { ApiSuccessResponse } from '@/common/decorators/api-success-response.decorator';

@Controller({ path: 'user/recipes', version: '1' })
@ApiTags('User Recipe Archive')
@UseGuards(JwtGuard)
@ApiBearerAuth('Authorization')
export class UserRecipeArchiveController {
  constructor(private readonly archiveService: UserRecipeArchiveService) {}

  // Bookmarks
  @Get('bookmarks')
  @ApiOperation({ summary: '북마크 목록 조회 (페이지네이션)' })
  @ApiSuccessResponse('북마크 목록 조회 성공', GetBookmarksResponseDto)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, ERROR_CODES.AUTH_REQUIRED)
  @ApiErrorResponse(HttpStatus.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND)
  async getBookmarks(
    @Request() req: any,
    @Query() query: GetBookmarksRequestDto,
  ): Promise<GetBookmarksResponseDto> {
    const userId = req.user.sub;
    return await this.archiveService.getBookmarks(userId, query);
  }

  @Post('bookmarks')
  @ApiOperation({ summary: '레시피 북마크' })
  @ApiSuccessResponse('레시피 북마크 성공', { type: 'boolean', example: true })
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, ERROR_CODES.AUTH_REQUIRED)
  @ApiErrorResponse(HttpStatus.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND)
  async createBookmark(
    @Request() req: any,
    @Body() createBookmarkDto: CreateBookmarkDto,
  ): Promise<boolean> {
    const userId = req.user.sub;
    return await this.archiveService.createBookmark(userId, createBookmarkDto);
  }

  @Delete('bookmarks/:recipeId')
  @ApiOperation({ summary: '레시피 북마크 해제' })
  @ApiSuccessResponse('레시피 북마크 해제 성공', {
    type: 'boolean',
    example: true,
  })
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, ERROR_CODES.AUTH_REQUIRED)
  @ApiErrorResponse(HttpStatus.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND)
  async deleteBookmark(
    @Request() req: any,
    @Param('recipeId', ParseIntPipe) recipeId: number,
  ): Promise<boolean> {
    const userId = req.user.sub;
    return await this.archiveService.deleteBookmark(userId, recipeId);
  }

  // Recent recipes
  @Get('recent')
  @ApiOperation({ summary: '최근 본 레시피 목록 조회 (페이지네이션)' })
  @ApiSuccessResponse(
    '최근 본 레시피 목록 조회 성공',
    GetRecentRecipesResponseDto,
  )
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, ERROR_CODES.AUTH_REQUIRED)
  async getRecentRecipes(
    @Request() req: any,
    @Query() query: GetRecentRecipesRequestDto,
  ): Promise<GetRecentRecipesResponseDto> {
    const userId = req.user.sub;
    return await this.archiveService.getRecentRecipes(userId, query);
  }

  @Post('recent/:recipeId')
  @ApiOperation({ summary: '최근 본 레시피 추가' })
  @ApiSuccessResponse('최근 본 레시피 추가 성공', {
    type: 'boolean',
    example: true,
  })
  @ApiErrorResponse(HttpStatus.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND)
  @ApiErrorResponse(HttpStatus.NOT_FOUND, ERROR_CODES.RECIPE_NOT_FOUND)
  async addRecentRecipe(
    @Request() req: any,
    @Param('recipeId', ParseIntPipe) recipeId: number,
  ): Promise<boolean> {
    const userId = req.user.sub;
    return this.archiveService.addRecentRecipe(userId, recipeId);
  }

  // Cooking start/complete
  @Post(':recipeId/start')
  @ApiOperation({ summary: '레시피 요리 시작 (바로 해먹기)' })
  @ApiSuccessResponse('레시피 요리 시작 성공', {
    type: 'boolean',
    example: true,
  })
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, ERROR_CODES.AUTH_REQUIRED)
  @ApiErrorResponse(HttpStatus.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND)
  @ApiErrorResponse(HttpStatus.NOT_FOUND, ERROR_CODES.RECIPE_NOT_FOUND)
  async startRecipeCooking(
    @Request() req: any,
    @Param('recipeId', ParseIntPipe) recipeId: number,
  ): Promise<boolean> {
    const userId = req.user.sub;
    return this.archiveService.startRecipeCooking(userId, recipeId);
  }

  @Post(':recipeId/complete')
  @ApiOperation({ summary: '레시피 완료' })
  @ApiSuccessResponse('레시피 완료 성공', { type: 'boolean', example: true })
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, ERROR_CODES.AUTH_REQUIRED)
  @ApiErrorResponse(HttpStatus.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND)
  @ApiErrorResponse(HttpStatus.NOT_FOUND, ERROR_CODES.RECIPE_NOT_FOUND)
  async completeRecipe(
    @Request() req: any,
    @Param('recipeId', ParseIntPipe) recipeId: number,
  ): Promise<boolean> {
    const userId = req.user.sub;
    return await this.archiveService.completeRecipe(userId, recipeId);
  }

  @Get('completed')
  @ApiOperation({ summary: '완료한 레시피 목록 조회 (페이지네이션)' })
  @ApiSuccessResponse(
    '완료한 레시피 목록 조회 성공',
    GetCompletedRecipesResponseDto,
  )
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, ERROR_CODES.AUTH_REQUIRED)
  @ApiErrorResponse(HttpStatus.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND)
  async getCompletedRecipes(
    @Request() req: any,
    @Query() query: GetCompletedRecipesRequestDto,
  ): Promise<GetCompletedRecipesResponseDto> {
    const userId = req.user.sub;
    return await this.archiveService.getCompletedRecipes(userId, query);
  }
}
