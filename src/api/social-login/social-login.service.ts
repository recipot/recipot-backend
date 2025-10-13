import { SocialLogin } from '@/database/entity/social-login.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SocialLoginService {
  private readonly logger = new Logger(SocialLoginService.name);

  constructor(
    @InjectRepository(SocialLogin)
    private readonly socialLoginRepository: Repository<SocialLogin>,
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
    });
  }

  /**
   * 사용자 ID로 소셜 로그인 정보 조회
   */
  async findByUserId(userId: number): Promise<SocialLogin[]> {
    return await this.socialLoginRepository.find({
      where: {
        userId,
      },
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
      userId,
      sid,
      platform,
    });
  }
}
