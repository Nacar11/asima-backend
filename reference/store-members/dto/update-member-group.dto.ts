import { ApiProperty } from '@nestjs/swagger';
import { IsInt, ValidateIf, IsDefined } from 'class-validator';

export class UpdateMemberGroupDto {
  @ApiProperty({
    description: 'Group ID to assign, or null to remove group assignment',
  })
  @IsDefined({ message: 'group_id is required (use null to remove group)' })
  @ValidateIf((o) => o.group_id !== null)
  @IsInt()
  group_id: number | null;
}
