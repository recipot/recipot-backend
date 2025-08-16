import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { UserService } from './user.service';

@Controller({ path: 'user', version: '1' })
@ApiTags('User')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * @description 유저를 상세조회한다.
   */
  @Get('/:id')
  @ApiOperation({ summary: '유저를 상세조회한다.' })
  @ApiResponse({ status: HttpStatus.OK })
  async getUser(@Param('id', ParseIntPipe) id: number) {
    return await this.userService.findById(id);
  }
}
