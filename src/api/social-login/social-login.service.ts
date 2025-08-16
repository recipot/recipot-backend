import { UserService } from '@/api/user/user.service';
import { SocialLogin } from '@/database/entity/social-login.entity';
import { User } from '@/database/entity/user.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SocialLoginService {
  private readonly logger = new Logger(SocialLoginService.name);

  constructor(
    @InjectRepository(SocialLogin)
    private readonly socialLoginRepository: Repository<SocialLogin>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userService: UserService,
  ) {}

  /**
   * 소셜 로그인 정보로 기존 사용자 조회
   */
  async findBySidAndPlatform(
    sid: string,
    platform: string,
  ): Promise<SocialLogin | null> {
    return await this.socialLoginRepository.findOne({
      where: {
        sid,
        platform,
      },
      relations: ['user'],
    });
  }

  /**
   * 소셜 로그인 정보 생성
   */
  async createSocialLogin(
    userId: number,
    sid: string,
    platform: string,
  ): Promise<SocialLogin> {
    return this.socialLoginRepository.save({
      user_id: userId,
      sid,
      platform,
    });
  }
}
