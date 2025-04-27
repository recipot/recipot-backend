import { IntersectionType, PickType } from '@nestjs/swagger';
import { UserDto } from './user.dto';
import { LoginDto } from '@/api/login/dto/login.dto';

export class SignupDtoTx extends IntersectionType(
  PickType(UserDto, [
    'nickName',
    'cookingLevel',
    'householdType',
    'job',
  ] as const),
  PickType(LoginDto, ['passid', 'password'] as const),
) {}
