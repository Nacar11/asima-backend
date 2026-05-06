import { PartialType } from '@nestjs/swagger';
import { CreateStoreUserGroupDto } from './create-store-user-group.dto';

export class UpdateStoreUserGroupDto extends PartialType(
  CreateStoreUserGroupDto,
) {}
