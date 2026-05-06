import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsNotEmpty,
  ValidateIf,
  Min,
  Max,
} from 'class-validator';

export class PickupSettingsDto {
  @ApiProperty({
    description: 'Whether pickup is enabled for this seller',
    example: true,
  })
  @IsBoolean()
  pickup_enabled: boolean;

  @ApiProperty({
    description: 'Pickup address ID from user_addresses table',
    example: 123,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @ValidateIf((dto) => dto.pickup_enabled === true)
  @IsNotEmpty({ message: 'Pickup address is required when pickup is enabled' })
  pickup_address_id?: number | null;

  @ApiProperty({
    description: 'Preparation time in minutes before pickup is ready',
    example: 30,
    default: 30,
  })
  @IsInt()
  @Min(15)
  @Max(480)
  pickup_preparation_time: number;

  @ApiProperty({
    description: 'Maximum concurrent pickup orders',
    example: 10,
    default: 10,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  pickup_max_concurrent_orders: number;

  @ApiProperty({
    description: 'Pickup instructions for customers',
    example: 'Please arrive at the back entrance and ring the bell',
    required: false,
  })
  @IsString()
  @IsOptional()
  pickup_instructions: string | null;

  @ApiProperty({
    description: 'Grace period in minutes before marking as no-show',
    example: 120,
    default: 120,
  })
  @IsInt()
  @Min(30)
  @Max(1440)
  pickup_grace_period: number;
}

export class PickupSettingsResponseDto extends PickupSettingsDto {
  @ApiProperty({
    description: 'Full pickup address object',
    example: {
      id: 123,
      address_line1: '123 Main St',
      city: 'Quezon City',
      state_province: 'Metro Manila',
      postal_code: '1100',
      country: 'Philippines',
    },
  })
  pickup_address: any;

  @ApiProperty({
    description: 'Store schedules for all 7 days',
    example: [
      {
        day_of_week: 1,
        start_time: '09:00',
        end_time: '18:00',
        status: 'Active',
        break_start: '12:00',
        break_end: '13:00',
      },
    ],
  })
  seller_schedules: any[];
}
