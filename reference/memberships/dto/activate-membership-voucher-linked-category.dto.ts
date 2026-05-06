import { ApiProperty } from '@nestjs/swagger';

export class ActivateMembershipVoucherLinkedCategoryDto {
  @ApiProperty({ type: Number, example: 1 })
  id: number;
  @ApiProperty({ type: String, example: 'Food' })
  name: string;
}
