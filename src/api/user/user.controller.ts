import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Public } from '@/api/auth/decorators/auth.decorators';
import { ApiSuccessResponse } from '@/common/decorators/api-success-response.decorator';
import { UserService } from './user.service';

@Controller({ path: 'user', version: '1' })
@ApiTags('User')
@ApiBearerAuth('Authorization')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * @description 유저를 상세조회한다.
   */
  @Get('/:id')
  @Public()
  @ApiOperation({ summary: '유저를 상세조회한다.' })
  @ApiResponse({ status: HttpStatus.OK })
  async getUser(@Param('id', ParseIntPipe) id: number) {
    return await this.userService.findById(id);
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
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증 실패',
  })
  async getMyProfile(@Request() req: any) {
    // JWT 가드를 통해 인증된 사용자 정보는 req.user에 자동으로 설정됨
    const userId = req.user.userId;
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
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '인증 실패',
  })
  async updateMyProfile(@Request() req: any) {
    // JWT 가드를 통해 인증된 사용자 정보는 req.user에 자동으로 설정됨
    const userId = req.user.userId;
    return {
      message: '프로필 업데이트 기능은 추후 구현 예정',
      userId: userId,
      user: req.user,
    };
  }
}
