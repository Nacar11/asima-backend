// Don't forget to use the class-validator decorators in the DTO properties.
// import { Allow } from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateUserPermissionDto } from './create-user-permission.dto';
import { StatusEnum } from '@/user-permissions/user-permissions.enum';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateUserPermissionDto extends CreateUserPermissionDto {
  @ApiPropertyOptional({
    type: () => String,
    example: StatusEnum.ACTIVE,
  })
  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  status?: StatusEnum;
}
