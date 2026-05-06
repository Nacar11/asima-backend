import { ApiProperty } from '@nestjs/swagger';

export class ActivateMembershipVoucherLinkedProductDto {
  @ApiProperty({ type: Number, example: 101 })
  id: number;
  @ApiProperty({ type: String, example: 'Sample Product' })
  name: string;
}
