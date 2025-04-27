import { UserEntity } from '@/database/entity/user.entity';
import { GetUserDtoRx } from '@/api/user/dto/get-user.dto';

export function toUserDto(user: UserEntity): GetUserDtoRx {
  return {
    id: user.id,
    nickName: user.nickName,
    cookingLevel: user.cookingLevel,
    householdType: user.householdType,
    job: user.job,
  };
}
