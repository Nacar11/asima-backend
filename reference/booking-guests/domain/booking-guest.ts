import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BookingGuest {
  @ApiProperty({ type: Number, example: 1 })
  id: number;

  @ApiProperty({ type: Number, example: 42 })
  booking_id: number;

  @ApiProperty({ type: Number, example: 1 })
  sort_order: number;

  @ApiProperty({ type: Boolean, example: true })
  is_primary_contact: boolean;

  @ApiProperty({ type: String, example: 'Guest' })
  first_name: string;

  @ApiProperty({ type: String, example: 'One' })
  last_name: string;

  @ApiProperty({ type: String, example: 'Guest One' })
  full_name: string;

  @ApiPropertyOptional({
    type: String,
    example: 'guest@example.com',
    nullable: true,
  })
  email: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '09123456789',
    nullable: true,
  })
  phone: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  created_by: number | null;

  @ApiProperty({ type: Date })
  created_at: Date;

  @ApiPropertyOptional({ type: Number, nullable: true })
  updated_by: number | null;

  @ApiProperty({ type: Date })
  updated_at: Date;
}
