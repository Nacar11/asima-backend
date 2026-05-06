// Don't forget to use the class-validator decorators in the DTO properties.
// import { Allow } from 'class-validator';

import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateMenuDto } from './create-menu.dto';
import { StatusEnum } from '@/menus/menus.enum';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateMenuDto extends PartialType(CreateMenuDto) {
  @ApiPropertyOptional({
    type: () => String,
    example: StatusEnum.ACTIVE,
  })
  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  status?: StatusEnum;
}
