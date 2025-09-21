import { DataSource } from 'typeorm';
import { SocialLogin } from '../entity/social-login.entity';
import { User } from '../entity/user.entity';
import { UserRole } from '@/api/user/enums/role.enum';

export class UserSeed {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    if (!this.dataSource || !this.dataSource.manager) {
      throw new Error('DataSource or manager is not available');
    }

    const userRepository = this.dataSource.manager.getRepository(User);
    const socialLoginRepository =
      this.dataSource.manager.getRepository(SocialLogin);

    // users 테이블에 데이터 삽입
    const user1Data = {
      email: 'user1@kakao.com',
      profileImageUrl: 'https://example.com/profile1.jpg',
      nickname: '카카오유저',
      recipeCompleteCount: 0,
      isFirstEntry: false,
      role: UserRole.GENERAL,
    };

    const user2Data = {
      email: 'user2@gmail.com',
      profileImageUrl: 'https://example.com/profile2.jpg',
      nickname: '구글유저',
      recipeCompleteCount: 0,
      isFirstEntry: false,
      role: UserRole.GENERAL,
    };

    // 기존 사용자 확인 및 생성
    let savedUser1 = await userRepository.findOne({
      where: { email: user1Data.email },
    });

    if (!savedUser1) {
      const user1 = userRepository.create(user1Data);
      savedUser1 = await userRepository.save(user1);
    }

    let savedUser2 = await userRepository.findOne({
      where: { email: user2Data.email },
    });

    if (!savedUser2) {
      const user2 = userRepository.create(user2Data);
      savedUser2 = await userRepository.save(user2);
    }

    // social_logins 테이블에 데이터 삽입
    const socialLogin1Data = {
      userId: savedUser1.id,
      sid: 'kakao_user_12345',
      platform: 'C01001', // 카카오 플랫폼 코드
    };

    const socialLogin2Data = {
      userId: savedUser2.id,
      sid: 'google_user_67890',
      platform: 'C01002', // 구글 플랫폼 코드
    };

    // 기존 소셜 로그인 확인 및 생성
    const existingSocialLogin1 = await socialLoginRepository.findOne({
      where: { userId: savedUser1.id, platform: 'C01001' },
    });

    if (!existingSocialLogin1) {
      const socialLogin1 = socialLoginRepository.create(socialLogin1Data);
      await socialLoginRepository.save(socialLogin1);
    }

    const existingSocialLogin2 = await socialLoginRepository.findOne({
      where: { userId: savedUser2.id, platform: 'C01002' },
    });

    if (!existingSocialLogin2) {
      const socialLogin2 = socialLoginRepository.create(socialLogin2Data);
      await socialLoginRepository.save(socialLogin2);
    }
  }
}
