import { Menu } from '@/menus/domain/menu';
import { User } from '@/users/domain/user';
import { BaseMasterDomain } from '@/utils/domain/base-master.domain';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DocumentSignatory extends BaseMasterDomain {
  @ApiProperty({
    type: () => Menu,
  })
  menu: Menu;

  @ApiProperty({
    type: String,
  })
  description: string;

  @ApiPropertyOptional({
    type: () => User,
  })
  endorsed_by?: User;

  @ApiPropertyOptional({
    type: () => User,
  })
  reviewed_by?: User;

  @ApiPropertyOptional({
    type: () => User,
  })
  approved_by?: User;
}
