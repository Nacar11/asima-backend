import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const TIME_WITH_OPTIONAL_END_OF_DAY_REGEX =
  /^(([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]|24:00:00)$/;

export class CreateAdminGuestVenueBookingDto {
  @ApiProperty({ type: Number, example: 42 })
  @Type(() => Number)
  @IsInt()
  service_id: number;

  @ApiProperty({ type: String, example: '2026-03-15' })
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  scheduled_date: string;

  @ApiProperty({ type: String, example: '09:00:00' })
  @IsNotEmpty()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
  scheduled_start_time: string;

  @ApiProperty({ type: String, example: '12:00:00' })
  @IsNotEmpty()
  @Matches(TIME_WITH_OPTIONAL_END_OF_DAY_REGEX, {
    message:
      'scheduled_end_time must be in HH:mm:ss format or exactly 24:00:00',
  })
  scheduled_end_time: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Reserved by admin for walk-in customer',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class CreateAdminGuestVenueBookingsDto {
  @ApiProperty({
    type: [CreateAdminGuestVenueBookingDto],
    description: 'Admin venue booking entries.',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateAdminGuestVenueBookingDto)
  bookings: CreateAdminGuestVenueBookingDto[];
}
