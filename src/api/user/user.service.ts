import { Injectable } from '@nestjs/common';
import * as brcypt from 'bcryptjs';
import { CacheService } from '@/common/cache/cache.service';
import { JwtToken } from '@/api/jwt/jwt.dto';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenType,
} from '@/api/jwt/jwt.type';
import { GetUsersDtoRx } from './dto/get-users.dto';
import { UpdateUserDtoTx } from './dto/update-user.dto';
import { SignupDtoTx } from './dto/signup.dto';
import { SigninDtoTx } from './dto/signin.dto';
import { JwtAuthService } from '../jwt/jwt.service';
import { UserCustomRepository } from './user-custom.repository';
import { CustomException } from '@/common/exceptions/custom-exception';
import { ERROR_CODES } from '@/common/constants/error-codes';
import { Transactional } from 'typeorm-transactional';
import { CustomLoggerService } from '@/common/logger/custom-logger.service';
import { LoggerFactoryService } from '@/common/logger/logger-factory.service';
import { Between } from 'typeorm';
import { LoginCustomRepository } from '../login/login.repository';
import { GetUserDtoRx } from './dto/get-user.dto';
import { SocialLoginCustomRepository } from '../social-login/social-login.repository';
import { toUserDto } from './mapper/user.mapper';
import { PaginationOptionsDto } from '@/common/dto/pagination-option.dto';
import { CommonRxDto } from '@/common/dto/common.rx.dto';

@Injectable()
export class UserService {
  private readonly logger: CustomLoggerService;

  constructor(
    private readonly loggerFactory: LoggerFactoryService,
    private readonly jwt: JwtAuthService,
    private readonly cache: CacheService,
    private readonly loginCustomRepository: LoginCustomRepository,
    private readonly socialLoginCustomRepository: SocialLoginCustomRepository,
    private readonly userCustomRepository: UserCustomRepository,
  ) {
    this.logger = this.loggerFactory.create(UserService.name);
  }

  /**
   * @author 김진태 <reabig4199@gmail.com>
   * @description 유저를 조회한다.
   */
  public async getUsers(
    paginationOptionsDto: PaginationOptionsDto,
    startDate: string,
    endDate: string,
  ): Promise<GetUsersDtoRx> {
    const { page, limit, sortBy, order } = paginationOptionsDto;

    const paginationOptions = {
      page,
      limit,
    };

    const where: Record<string, any> = {};

    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    }

    const searchOptions = {
      where,
      order: { [sortBy]: order },
      relations: ['login', 'socialLogin'],
    };

    const result = await this.userCustomRepository.findWithPagination(
      paginationOptions,
      searchOptions,
    );

    if (!result || result.items.length === 0) {
      throw new CustomException(ERROR_CODES.USER_NOT_FOUND);
    }

    const userDtos = result.items.map(toUserDto);

    return {
      results: userDtos,
      totalItems: result.meta.totalItems,
    };
  }

  /**
   * @author 김진태 <realbig4199@gmail.com>
   * @description 유저를 상세조회한다.
   */
  public async getUser(id: number): Promise<GetUserDtoRx> {
    const user = await this.userCustomRepository.userRepository.findOne({
      where: { id },
      relations: ['login', 'socialLogin'],
    });

    if (!user) {
      throw new CustomException(ERROR_CODES.USER_NOT_FOUND);
    }

    return toUserDto(user);
  }

  /**
   * @author 김진태 <realbig4199@gmail.com>
   * @description 유저를 수정한다.
   */
  @Transactional()
  public async updateUser(
    user: AccessTokenPayload,
    id: number,
    dto: UpdateUserDtoTx,
  ) {
    const currentUser = await this.userCustomRepository.userRepository.findOne({
      where: { id: user.userId },
    });

    if (!currentUser) {
      throw new CustomException(ERROR_CODES.USER_NOT_FOUND);
    }

    const userToUpdate = await this.userCustomRepository.userRepository.findOne(
      {
        where: { id },
        relations: ['login', 'socialLogin'],
      },
    );

    if (!userToUpdate) {
      throw new CustomException(ERROR_CODES.USER_NOT_FOUND);
    }

    if (currentUser.id !== userToUpdate.id) {
      throw new CustomException(ERROR_CODES.AUTH_ACCESS_DENIED);
    }

    await this.userCustomRepository.userRepository.update(userToUpdate.id, dto);
  }

  /**
   * @author 김진태 <realbig4199@gmail.com>
   * @description 유저를 삭제한다.
   */
  @Transactional()
  public async deleteUser(user: AccessTokenPayload, id: number) {
    const currentUser = await this.userCustomRepository.userRepository.findOne({
      where: { id: user.userId },
      relations: ['login', 'socialLogin'],
    });

    if (!currentUser) {
      throw new CustomException(ERROR_CODES.USER_NOT_FOUND);
    }

    const userToDelete = await this.userCustomRepository.userRepository.findOne(
      {
        where: { id },
        relations: ['login', 'socialLogin'],
      },
    );

    if (!userToDelete) {
      throw new CustomException(ERROR_CODES.USER_NOT_FOUND);
    }

    if (currentUser.id !== userToDelete.id) {
      throw new CustomException(ERROR_CODES.AUTH_ACCESS_DENIED);
    }

    await this.userCustomRepository.userRepository.softDelete(id);

    if (userToDelete.login) {
      await this.loginCustomRepository.loginRepository.softDelete(
        userToDelete.login.id,
      );
    }

    if (userToDelete.socialLogin) {
      await this.socialLoginCustomRepository.SocialLoginRepository.softDelete(
        userToDelete.socialLogin.id,
      );
    }
  }

  /**
   * @author 김진태 <realbig4199@gmail.com>
   * @description 유저를 생성한다. (회원가입)
   */
  @Transactional()
  public async signup(dto: SignupDtoTx): Promise<JwtToken> {
    const existingUser =
      await this.loginCustomRepository.loginRepository.findOne({
        where: { passid: dto.passid },
        relations: ['user'],
      });

    if (existingUser) {
      throw new CustomException(ERROR_CODES.USER_ALREADY_EXISTS);
    }

    const hashedPassword = await brcypt.hash(dto.password, 10);

    const newLogin = await this.loginCustomRepository.loginRepository.save({
      passid: dto.passid,
      password: hashedPassword,
    });

    const newUser = await this.userCustomRepository.userRepository.save({
      nickName: dto.nickName,
      cookingLevel: dto.cookingLevel,
      householdType: dto.householdType,
      job: dto.job,
      login: newLogin,
    });

    const accessPayload: AccessTokenPayload = await this.jwt.generatePayload(
      newUser.id,
      TokenType.Access,
    );

    const refreshPayload: RefreshTokenPayload = await this.jwt.generatePayload(
      newUser.id,
      TokenType.Refresh,
    );

    const token = await this.jwt.generateToken(accessPayload, refreshPayload);

    await this.cache.set(
      newUser.id.toString(),
      token.refreshToken,
      86400 * 1000,
    );

    return token;
  }

  /**
   * @author 김진태 <realbig4199@gmail.com>
   * @description 로그인한다.
   */
  public async signin(dto: SigninDtoTx): Promise<CommonRxDto | JwtToken> {
    const login = await this.loginCustomRepository.loginRepository.findOne({
      where: { passid: dto.passid },
      relations: ['user'],
    });

    if (!login) {
      throw new CustomException(ERROR_CODES.USER_NOT_FOUND);
    }

    const isValid = await brcypt.compare(dto.password, login.password);

    if (!isValid) {
      throw new CustomException(ERROR_CODES.AUTH_INVALID_PASSWORD);
    }

    const user = await this.userCustomRepository.userRepository.findOne({
      where: { id: login.user.id },
    });

    if (!user) {
      throw new CustomException(ERROR_CODES.USER_NOT_FOUND);
    }

    const accessPayload: AccessTokenPayload = await this.jwt.generatePayload(
      user.id,
      TokenType.Access,
    );

    const refreshPayload: RefreshTokenPayload = await this.jwt.generatePayload(
      user.id,
      TokenType.Refresh,
    );

    const token = await this.jwt.generateToken(accessPayload, refreshPayload);

    await this.cache.set(user.id.toString(), token.refreshToken, 86400 * 1000);

    return token;
  }
}
