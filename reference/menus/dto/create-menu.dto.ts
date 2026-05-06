import { PermissionEnum } from '@/menus/menus.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsString, Length } from 'class-validator';

export class CreateMenuDto {
  // Don't forget to use the class-validator decorators in the DTO properties.
  @ApiProperty({
    type: () => String,
    nullable: false,
    example: 'S001',
  })
  @IsString()
  @Length(4, 4)
  menu_code: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
    example: 'Sales Order List',
  })
  @IsString()
  @Length(1, 50)
  menu_name: string;

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
  permissions: PermissionEnum[];
}
