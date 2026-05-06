import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsEmail,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  CreateGuestAdditionalGuestDto,
  GUEST_VENUE_PAYMENT_METHODS,
  GuestVenuePaymentMethod,
  IsValidPaymentMethod,
  normalizeGuestVenuePaymentMethod,
} from './create-guest-venue-booking.dto';
import { lowerCaseTransformer } from '@/utils/transformers/lower-case.transformer';

export class CreateGuestOpenPlayRegistrationDto {
  @ApiProperty({ type: String, example: 'Juan' })
  @IsString()
  @Length(1, 100)
  first_name: string;

  @ApiProperty({ type: String, example: 'dela Cruz' })
  @IsString()
  @Length(1, 100)
  last_name: string;

  @ApiProperty({ type: String, example: 'juan@example.com' })
  @Transform(lowerCaseTransformer)
  @IsEmail()
  @Length(1, 100)
  email: string;

  @ApiProperty({ type: String, example: '+639171234567' })
  @IsString()
  @Length(7, 20)
  phone: string;

  @ApiPropertyOptional({
    type: String,
    enum: GUEST_VENUE_PAYMENT_METHODS,
    example: 'gcash',
    default: 'gcash',
  })
  @Transform(({ value }) => normalizeGuestVenuePaymentMethod(value))
  @IsOptional()
  @IsString()
  @IsValidPaymentMethod()
  payment_method?: GuestVenuePaymentMethod;

  @ApiPropertyOptional({
    type: String,
    example: 'Bringing new players',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiPropertyOptional({
    type: [CreateGuestAdditionalGuestDto],
    description:
      'Additional participants beyond the primary contact. Max 31, total 32 participants per registration.',
  })
  @IsOptional()
  @ArrayMaxSize(31)
  @ValidateNested({ each: true })
  @Type(() => CreateGuestAdditionalGuestDto)
  additional_guests?: CreateGuestAdditionalGuestDto[];

  @ApiPropertyOptional({
    type: String,
    example: '192.168.1.1',
    nullable: true,
    description: 'End-user IP address (recommended for DragonPay V2)',
  })
  @IsOptional()
  @IsString()
  ip_address?: string;
}
