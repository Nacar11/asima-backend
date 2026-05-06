import { Menu } from '@/menus/domain/menu';
import { TransformMenu } from '@/menus/menus.transformer';
import { MenuExists } from '@/menus/menus.validator';
import { User } from '@/users/domain/user';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateDocumentSignatoryDto {
  // Don't forget to use the class-validator decorators in the DTO properties.
  @ApiProperty({
    type: Number,
  })
  @IsNotEmpty()
  @MenuExists()
  @TransformMenu()
  menu: Menu;

  @ApiProperty({
    type: String,
  })
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    type: () => Number,
  })
  @IsOptional()
  reviewed_by?: User;

  @ApiPropertyOptional({
    type: () => Number,
  })
  @IsOptional()
  approved_by?: User;
}
