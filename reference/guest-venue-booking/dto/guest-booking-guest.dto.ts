import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GuestBookingGuestDto {
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
}
