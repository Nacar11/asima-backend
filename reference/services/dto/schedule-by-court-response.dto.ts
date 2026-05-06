import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScheduleByCourtServiceSummaryDto {
  @ApiProperty({ type: Number, example: 101 })
  id: number;

  @ApiProperty({ type: String, example: 'Court A - Pickleball' })
  title: string;
}

export class ScheduleByCourtUserDto {
  @ApiProperty({ type: Number, example: 20 })
  id: number;

  @ApiProperty({ type: String, example: 'Juan' })
  first_name: string;

  @ApiProperty({ type: String, example: 'Dela Cruz' })
  last_name: string;

  @ApiProperty({ type: String, example: 'juan@example.com' })
  email: string;

  @ApiPropertyOptional({ type: String, example: '+639171234567' })
  phone: string | null;
}

export class ScheduleByCourtCustomerDto {
  @ApiProperty({ type: ScheduleByCourtUserDto })
  user: ScheduleByCourtUserDto;
}

export class ScheduleByCourtBookingDto {
  @ApiProperty({ type: Number, example: 5501 })
  id: number;

  @ApiProperty({ type: String, example: 'BK-20260305-0001' })
  booking_number: string;

  @ApiPropertyOptional({ type: String, example: 'BKG-20260305-1234' })
  booking_group_number?: string | null;

  @ApiProperty({ type: String, format: 'date', example: '2026-03-05' })
  scheduled_date: string;

  @ApiProperty({ type: String, format: 'time', example: '09:00:00' })
  scheduled_start_time: string;

  @ApiPropertyOptional({ type: String, format: 'time', example: '10:00:00' })
  scheduled_end_time: string | null;

  @ApiProperty({ type: String, example: 'confirmed' })
  status: string;

  @ApiPropertyOptional({ type: String, example: 'paid' })
  sales_order_payment_status?: string | null;

  @ApiPropertyOptional({ type: Number, example: 77 })
  open_play_event_id?: number | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Juan Dela Cruz, Maria Dela Cruz',
  })
  guest_names_summary?: string | null;

  @ApiProperty({ type: ScheduleByCourtServiceSummaryDto })
  service: ScheduleByCourtServiceSummaryDto;

  @ApiProperty({ type: ScheduleByCourtCustomerDto })
  customer: ScheduleByCourtCustomerDto;
}

export class ScheduleByCourtBlockedSlotDto {
  @ApiProperty({ type: Number, example: 901 })
  id: number;

  @ApiPropertyOptional({ type: Number, example: 101 })
  service_id?: number | null;

  @ApiProperty({ type: String, format: 'date', example: '2026-03-11' })
  unavailable_date: string;

  @ApiPropertyOptional({ type: String, format: 'date', example: '2026-03-12' })
  end_date?: string | null;

  @ApiPropertyOptional({ type: String, format: 'time', example: '12:00:00' })
  start_time?: string | null;

  @ApiPropertyOptional({ type: String, format: 'time', example: '14:00:00' })
  end_time?: string | null;

  @ApiProperty({ type: Boolean, example: false })
  is_full_day: boolean;

  @ApiPropertyOptional({ type: String, example: 'Private event' })
  reason?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'open_play',
    description: 'Block type (e.g. maintenance, open_play)',
  })
  block_type?: string | null;

  @ApiPropertyOptional({ type: Number, example: 77 })
  open_play_event_id?: number | null;

  @ApiProperty({ type: String, example: 'Active' })
  status: string;
}

export class ScheduleByCourtResponseDto {
  @ApiProperty({ type: ScheduleByCourtBookingDto, isArray: true })
  bookings: ScheduleByCourtBookingDto[];

  @ApiProperty({ type: ScheduleByCourtBlockedSlotDto, isArray: true })
  blocked_slots: ScheduleByCourtBlockedSlotDto[];
}
