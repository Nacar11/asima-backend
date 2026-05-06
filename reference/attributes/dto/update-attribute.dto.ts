import { PartialType } from '@nestjs/swagger';
import { CreateAttributeDto } from './create-attribute.dto';
import { User } from '@/users/domain/user';

export class UpdateAttributeDto extends PartialType(CreateAttributeDto) {
  deleted_by?: User;
}
