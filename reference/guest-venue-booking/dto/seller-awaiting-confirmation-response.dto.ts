import { ApiProperty } from '@nestjs/swagger';
import { SellerAwaitingConfirmationBookingDto } from './seller-awaiting-confirmation-booking.dto';

export class SellerAwaitingConfirmationResponseDto {
  @ApiProperty({
    type: [SellerAwaitingConfirmationBookingDto],
  })
  data: SellerAwaitingConfirmationBookingDto[];

  @ApiProperty({ type: Number, example: 5 })
  totalCount: number;

  @ApiProperty({ type: Number, example: 0 })
  skip: number;

  @ApiProperty({ type: Number, example: 20 })
  take: number;
}
