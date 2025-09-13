import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Public } from '@/api/auth/auth.decorators';
import { ApiSuccessResponse } from '@/common/decorators/api-success-response.decorator';
import { UserService } from './user.service';
import { UserDto } from '@/api/user/dto/user.dto';
import { ERROR_CODES } from '@/common/constants/error-codes';
import { CustomException } from '@/common/exceptions/custom-exception';
import { UpdateMyProfileDto } from '@/api/user/dto/update-my-profile.dto';

@Controller({ path: 'user', version: '1' })
@ApiTags('User')
@ApiBearerAuth('Authorization')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * @description 인증된 사용자의 프로필을 조회한다. (마이페이지 메인)
   */
  @Get('/profile/me')
  @ApiOperation({
    summary: '인증된 사용자의 프로필 조회 (마이페이지 메인)',
    description: 'JWT 토큰을 통해 인증된 현재 사용자의 프로필을 조회합니다.',
  })
  @ApiSuccessResponse('프로필 조회 성공', { type: UserDto })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증 실패',
    schema: {
      example: {
        code: ERROR_CODES.AUTH_REQUIRED.code,
        message: ERROR_CODES.AUTH_REQUIRED.message,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '사용자 없음',
    schema: {
      example: {
        code: ERROR_CODES.USER_NOT_FOUND.code,
        message: ERROR_CODES.USER_NOT_FOUND.message,
      },
    },
  })
  async getMyProfile(@Request() req: any) {
    const userId = req.user?.userId ?? req.user?.sub ?? req.user?.id ?? null;

    if (!userId) throw new CustomException(ERROR_CODES.AUTH_REQUIRED);
    return await this.userService.getByIdOrThrow(Number(userId));
  }

  /**
   * @description 인증된 사용자의 프로필을 업데이트한다. (내 정보 설정 변경)
   */
  @Patch('/profile/update')
  @ApiOperation({
    summary: '인증된 사용자의 프로필 업데이트 (내 정보 설정 변경)',
    description:
      'nickname, profile_image_url, is_first_entry 중 필요한 항목만 보냅니다.',
  })
  @ApiBody({ type: UpdateMyProfileDto })
  @ApiSuccessResponse('프로필 업데이트 성공', { type: UserDto })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증 실패',
    schema: {
      example: {
        code: ERROR_CODES.AUTH_REQUIRED.code,
        message: ERROR_CODES.AUTH_REQUIRED.message,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '사용자 없음',
    schema: {
      example: {
        code: ERROR_CODES.USER_NOT_FOUND.code,
        message: ERROR_CODES.USER_NOT_FOUND.message,
      },
    },
  })
  async updateMyProfile(@Request() req: any, @Body() dto: UpdateMyProfileDto) {
    const userId = req.user?.userId ?? req.user?.sub ?? req.user?.id ?? null;

    if (!userId) throw new CustomException(ERROR_CODES.AUTH_REQUIRED);
    return await this.userService.updateMyProfile(Number(userId), dto);
  }

  /**
   * @description 유저를 상세조회한다. (공개)
   *  ⚠️ 정적 경로보다 아래에 둡니다.
   */
  @Get('/:id')
  @Public()
  @ApiOperation({ summary: '유저 상세 조회 (public)' })
  @ApiResponse({ status: HttpStatus.OK, type: UserDto })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '사용자 없음',
    schema: {
      example: {
        code: ERROR_CODES.USER_NOT_FOUND.code,
        message: ERROR_CODES.USER_NOT_FOUND.message,
      },
    },
  })
  async getUser(@Param('id', ParseIntPipe) id: number) {
    return await this.userService.getByIdOrThrow(id);
  }

  // /**
  //  * @description 유저를 상세조회한다.
  //  */
  // @Get('/:id')
  // @Public()
  // @ApiOperation({ summary: '유저를 상세조회한다.' })
  // @ApiResponse({ status: HttpStatus.OK })
  // async getUser(@Param('id', ParseIntPipe) id: number) {
  //   return await this.userService.findById(id);
  // }
}
