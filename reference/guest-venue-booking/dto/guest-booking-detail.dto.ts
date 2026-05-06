import { ApiProperty } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { GuestBookingGuestDto } from './guest-booking-guest.dto';

export class GuestBookingDetailDto {
  @ApiProperty({ type: String })
  booking_number: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  booking_group_number?: string | null;

  @ApiProperty({ type: String })
  status: string;

  @ApiProperty({ type: String })
  payment_status: string;

  @ApiProperty({ type: String })
  service_title: string;

  @ApiProperty({ type: String })
  seller_store_name: string;

  @ApiProperty({ type: String })
  scheduled_date: string;

  @ApiProperty({ type: String })
  scheduled_start_time: string;

  @ApiProperty({ type: String, nullable: true })
  scheduled_end_time: string | null;

  @ApiProperty({ type: Number })
  amount: number;

  @ApiProperty({ type: String })
  currency: string;

  @ApiProperty({ type: String })
  guest_name: string;

  @ApiProperty({ type: String })
  confirmation_sent_to: string;

  @ApiProperty({ type: Number, example: 4 })
  guest_count: number;

  @ApiPropertyOptional({
    type: [GuestBookingGuestDto],
    nullable: true,
  })
  guests?: GuestBookingGuestDto[] | null;

  @ApiPropertyOptional({
    type: GuestBookingGuestDto,
    nullable: true,
  })
  primary_guest?: GuestBookingGuestDto | null;
}
