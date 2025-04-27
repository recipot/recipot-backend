import { OmitType, PartialType } from '@nestjs/swagger';
import { UserDto } from './user.dto';

export class UpdateUserDtoTx extends PartialType(OmitType(UserDto, ['id'])) {}
