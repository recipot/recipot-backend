import { CustomLoggerService } from '@/common/logger/custom-logger.service';
import { LoggerFactoryService } from '@/common/logger/logger-factory.service';
import { User } from '@/database/entity/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserDto } from './dto/user.dto';
import { ERROR_CODES } from '@/common/constants/error-codes';
import { CustomException } from '@/common/exceptions/custom-exception';

@Injectable()
export class UserService {
  private readonly logger: CustomLoggerService;

  constructor(
    private readonly loggerFactory: LoggerFactoryService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    this.logger = this.loggerFactory.create(UserService.name);
  }

  private toDto(user: User): UserDto {
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      profile_image_url: user.profile_image_url,
      recipe_complete_count: user.recipe_complete_count,
      is_first_entry: user.is_first_entry,
    };
  }

  /**
   * 사용자 정보(email)로 새 유저를 생성합니다.
   */
  async createUser(email: string): Promise<User> {
    return this.userRepository.save({
      email,
      nickname: '닉네임',
      profile_image_url: '',
      recipe_complete_count: 0,
      is_first_entry: true,
    });
  }

  /**
   * 사용자 ID로 사용자 정보를 조회합니다.
   * 존재하지 않으면 null을 반환합니다.
   */
  async findById(id: number): Promise<UserDto | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    return user ? this.toDto(user) : null;
  }

  /**
   * 사용자 ID로 조회 (없으면 에러코드로 예외)
   */
  async getByIdOrThrow(id: number): Promise<UserDto> {
    const dto = await this.findById(id);
    if (!dto) throw new CustomException(ERROR_CODES.USER_NOT_FOUND);
    return dto;
  }

  /**
   * 인증된 사용자의 프로필을 업데이트합니다.
   */
  async updateMyProfile(
    userId: number,
    payload: Partial<
      Pick<User, 'nickname' | 'profile_image_url' | 'is_first_entry'>
    >,
  ): Promise<UserDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new CustomException(ERROR_CODES.USER_NOT_FOUND);

    if (payload.nickname !== undefined) user.nickname = payload.nickname;
    if (payload.profile_image_url !== undefined)
      user.profile_image_url = payload.profile_image_url;
    if (payload.is_first_entry !== undefined)
      user.is_first_entry = payload.is_first_entry;

    const saved = await this.userRepository.save(user);
    return this.toDto(saved);
  }
}
