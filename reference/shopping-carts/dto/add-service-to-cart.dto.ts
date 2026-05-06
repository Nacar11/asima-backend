import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsInt,
  Min,
  IsPositive,
  IsOptional,
  IsBoolean,
  IsDateString,
  Matches,
  IsString,
  Length,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AppointmentLocationTypeEnum } from '@/bookings/enums/appointment-location-type.enum';

/**
 * DTO for a selected service add-on.
 */
export class SelectedAddonDto {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Add-on ID',
  })
  @IsNotEmpty({ message: 'Add-on ID is required' })
  @IsInt({ message: 'Add-on ID must be an integer' })
  @IsPositive({ message: 'Add-on ID must be a positive number' })
  addon_id: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Quantity of this add-on',
    minimum: 1,
  })
  @IsNotEmpty({ message: 'Quantity is required' })
  @IsInt({ message: 'Quantity must be an integer' })
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;
}

/**
 * DTO for a selected service option value.
 */
export class SelectedOptionDto {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Option group ID',
  })
  @IsNotEmpty({ message: 'Option group ID is required' })
  @IsInt({ message: 'Option group ID must be an integer' })
  @IsPositive({ message: 'Option group ID must be a positive number' })
  option_group_id: number;

  @ApiProperty({
    type: Number,
    example: 5,
    description: 'Option value ID',
  })
  @IsNotEmpty({ message: 'Option value ID is required' })
  @IsInt({ message: 'Option value ID must be an integer' })
  @IsPositive({ message: 'Option value ID must be a positive number' })
  option_value_id: number;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Quantity (for counter-type options)',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt({ message: 'Quantity must be an integer' })
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity?: number = 1;
}

/**
 * DTO for adding a service item to the shopping cart.
 *
 * Validates that the service_id, scheduled_date, and scheduled_start_time are provided.
 * Package ID is optional. Quantity defaults to 1. Service availability validation
 * is performed in the service layer.
 *
 * Supports optional selected_addons and selected_options arrays to attach
 * service customizations to the cart item.
 *
 * @version 2
 * @since 1.0.0
 */
export class AddServiceToCartDto {
  @ApiProperty({
    type: Number,
    example: 10,
    description: 'Service ID to add to cart',
  })
  @IsNotEmpty({ message: 'Service ID is required' })
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt({ message: 'Service ID must be an integer' })
  @IsPositive({ message: 'Service ID must be a positive number' })
  service_id: number;

  @ApiPropertyOptional({
    type: Number,
    example: 3,
    description: 'Service package ID (optional, for package-based services)',
    nullable: true,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : null))
  @IsInt({ message: 'Package ID must be an integer' })
  @IsPositive({ message: 'Package ID must be a positive number' })
  package_id?: number | null;

  @ApiProperty({
    type: String,
    example: '2024-12-25',
    description: 'Scheduled date for the service (YYYY-MM-DD format)',
  })
  @IsNotEmpty({ message: 'Scheduled date is required' })
  @IsDateString(
    {},
    { message: 'Scheduled date must be a valid date in YYYY-MM-DD format' },
  )
  scheduled_date: string;

  @ApiProperty({
    type: String,
    example: '09:00:00',
    description: 'Scheduled start time for the service (HH:mm:ss format)',
  })
  @IsNotEmpty({ message: 'Scheduled start time is required' })
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'Scheduled start time must be in HH:mm:ss format',
  })
  scheduled_start_time: string;

  @ApiPropertyOptional({
    type: String,
    example: '11:00:00',
    description:
      'Scheduled end time for venue services (HH:mm:ss format). Required for venue service type.',
    nullable: true,
  })
  @IsOptional()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'Scheduled end time must be in HH:mm:ss format',
  })
  scheduled_end_time?: string | null;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Quantity to add (must be at least 1, default: 1)',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 1))
  @IsInt({ message: 'Quantity must be an integer' })
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity?: number = 1;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description:
      'Address ID where service will be performed (from user addresses)',
    nullable: true,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : null))
  @IsInt({ message: 'Service address ID must be an integer' })
  @IsPositive({ message: 'Service address ID must be a positive number' })
  service_address_id?: number | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Please bring extra cleaning supplies. Gate code is 1234.',
    description: 'Special requests or instructions for the service provider',
    nullable: true,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'Special requests must be a string' })
  @Length(0, 1000, {
    message: 'Special requests must be at most 1000 characters',
  })
  special_requests?: string | null;

  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    description: 'Whether this item is selected for checkout',
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'is_selected must be a boolean' })
  is_selected?: boolean = false;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description:
      'Form submission ID for service requirements filled by customer',
    nullable: true,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : null))
  @IsInt({ message: 'Form submission ID must be an integer' })
  @IsPositive({ message: 'Form submission ID must be a positive number' })
  form_submission_id?: number | null;

  @ApiPropertyOptional({
    description: 'Appointment location type for this service',
    enum: AppointmentLocationTypeEnum,
    default: AppointmentLocationTypeEnum.HOME_SERVICE,
  })
  @IsOptional()
  @IsString()
  appointment_location_type?: string;

  @ApiPropertyOptional({
    type: [SelectedAddonDto],
    description: 'Selected service add-ons with quantities',
    example: [{ addon_id: 1, quantity: 2 }],
  })
  @IsOptional()
  @IsArray({ message: 'selected_addons must be an array' })
  @ValidateNested({ each: true })
  @Type(() => SelectedAddonDto)
  selected_addons?: SelectedAddonDto[];

  @ApiPropertyOptional({
    type: [SelectedOptionDto],
    description: 'Selected service option values',
    example: [{ option_group_id: 1, option_value_id: 5, quantity: 1 }],
  })
  @IsOptional()
  @IsArray({ message: 'selected_options must be an array' })
  @ValidateNested({ each: true })
  @Type(() => SelectedOptionDto)
  selected_options?: SelectedOptionDto[];
}
