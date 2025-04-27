import { PickType } from '@nestjs/swagger';
import { UserDto } from './user.dto';

export class GetUserDtoRx extends PickType(UserDto, [
  'id',
  'nickName',
  'cookingLevel',
  'householdType',
  'job',
] as const) {}
