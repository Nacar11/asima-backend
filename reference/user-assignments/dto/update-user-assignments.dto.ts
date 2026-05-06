// Don't forget to use the class-validator decorators in the DTO properties.
// import { Allow } from 'class-validator';

import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateUserAssignmentsDto } from './create-user-assignments.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { StatusEnum } from '@/user-assignments/user-assignments.enum';

export class UpdateUserAssignmentsDto extends PartialType(
  CreateUserAssignmentsDto,
) {
  @ApiPropertyOptional({
    type: () => String,
    example: StatusEnum.ACTIVE,
  })
  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  status?: StatusEnum;
}
