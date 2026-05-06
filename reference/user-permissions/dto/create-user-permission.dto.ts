import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsPositive } from 'class-validator';
import { PermissionEnum } from '@/user-permissions/user-permissions.enum';

export class CreateUserPermissionDto {
  // Don't forget to use the class-validator decorators in the DTO properties.
  @ApiProperty({
    type: Number,
    required: true,
    example: 1,
  })
  @IsPositive()
  group: number;

  @ApiProperty({
    type: Number,
    required: true,
    example: 1,
  })
  @IsPositive()
  menu: number;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
    },
    example: [
      PermissionEnum.APPROVE,
      PermissionEnum.DELETE,
      PermissionEnum.EDIT,
      PermissionEnum.ENDORSE,
      PermissionEnum.REVIEW,
      PermissionEnum.UPLOAD,
      PermissionEnum.VIEW,
    ],
  })
  @IsArray()
  @IsEnum(PermissionEnum, { each: true })
  permissions: string[];
}
