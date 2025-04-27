import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  UseGuards,
  Request,
  Query,
  Param,
  Put,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtToken } from '@/api/jwt/jwt.dto';

import { PaginationOptionsDto } from '@/common/dto/pagination-option.dto';
import { JwtGuard } from '@/api/jwt/jwt.guard';
import { GetUsersDtoRx } from './dto/get-users.dto';
import { UpdateUserDtoTx } from './dto/update-user.dto';
import { SignupDtoTx } from './dto/signup.dto';
import { SigninDtoTx } from './dto/signin.dto';
import { UserService } from './user.service';
import { GetUserDtoRx } from './dto/get-user.dto';

@Controller({ path: 'user', version: '1' })
@ApiTags('User')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * @author 김진태 <reabig4199@gmail.com>
   * @description 유저를 조회한다.
   */
  @UseGuards(JwtGuard)
  @ApiBearerAuth('Authorization')
  @Get('/')
  @ApiOperation({ summary: '유저를 조회한다.' })
  @ApiResponse({ status: HttpStatus.OK, type: GetUsersDtoRx })
  async getUsers(
    @Query() paginationOptionsDto: PaginationOptionsDto,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return await this.userService.getUsers(
      paginationOptionsDto,
      startDate,
      endDate,
    );
  }

  /**
   * @author 김진태 <realbig4199@gmail.com>
   * @description 유저를 상세조회한다.
   */
  @UseGuards(JwtGuard)
  @ApiBearerAuth('Authorization')
  @Get('/:id')
  @ApiOperation({ summary: '유저를 상세조회한다.' })
  @ApiResponse({ status: HttpStatus.OK, type: GetUserDtoRx })
  async getUser(@Param('id', ParseIntPipe) id: number) {
    return await this.userService.getUser(id);
  }

  /**
   * @author 김진태 <realbig4199@gmail.com>
   * @description 유저를 수정한다.
   */
  @UseGuards(JwtGuard)
  @ApiBearerAuth('Authorization')
  @Put('/:id')
  @ApiOperation({ summary: '유저를 수정한다.' })
  @ApiResponse({ status: HttpStatus.OK })
  async updateUser(
    @Request() request: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDtoTx,
  ) {
    return await this.userService.updateUser(request.user, id, dto);
  }

  /**
   * @author 김진태 <realbig4199@gmail.com>
   * @description 유저를 삭제한다.
   */
  @UseGuards(JwtGuard)
  @ApiBearerAuth('Authorization')
  @Delete('/:id')
  @ApiOperation({ summary: '유저를 삭제한다.' })
  @ApiResponse({ status: HttpStatus.OK })
  async deleteUser(
    @Request() request: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.userService.deleteUser(request.user, id);
  }

  /**
   * @author 김진태 <realbig4199@gmail.com>
   * @description 유저를 생성한다. (회원가입)
   */
  @Post('/signup')
  @ApiOperation({ summary: '유저를 생성한다. (회원가입)' })
  @ApiResponse({ status: HttpStatus.CREATED, type: JwtToken })
  async signup(@Body() dto: SignupDtoTx): Promise<JwtToken> {
    return await this.userService.signup(dto);
  }

  /**
   * @author 김진태 <realbig4199@gmail.com>
   * @description 로그인한다.
   */
  @Post('/signin')
  @ApiOperation({ summary: '로그인한다.' })
  @ApiResponse({ status: HttpStatus.OK, type: JwtToken })
  async signin(@Body() dto: SigninDtoTx) {
    return await this.userService.signin(dto);
  }
}
