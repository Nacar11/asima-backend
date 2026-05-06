import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsInt,
  IsPositive,
  IsDateString,
  Matches,
  IsOptional,
  IsString,
  MaxLength,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  IsIn,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentLocationTypeEnum } from '@/bookings/enums/appointment-location-type.enum';

/**
 * DTO for form field values in preventive booking request.
 */
export class FormFieldValueDto {
  @ApiProperty({
    description: 'Form template ID',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  form_template_id: number;

  @ApiProperty({
    description: 'Field code (must match form template code)',
    example: 'quantity',
  })
  @IsNotEmpty()
  @IsString()
  field_code: string;

  @ApiProperty({
    description: 'Field value',
    example: '5',
  })
  @IsNotEmpty()
  @IsString()
  value: string;
}

/**
 * DTO for creating a preventive booking request.
 *
 * Used for services that require a quote (requires_quote = true).
 * Creates a booking with status AWAITING_QUOTATION and a form submission.
 * NO payment is required at this stage.
 *
 * @version 1
 * @since 1.0.0
 */
export class CreatePreventiveBookingRequestDto {
  @ApiProperty({
    description: 'Service ID to request booking for',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  service_id: number;

  @ApiProperty({
    description: 'Form field values from the service form templates',
    type: [FormFieldValueDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormFieldValueDto)
  form_values: FormFieldValueDto[];

  @ApiProperty({
    description: 'Whether this is a recurring booking request',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_recurring?: boolean;

  @ApiPropertyOptional({
    description: 'Number of recurrences (e.g., 4 for 4 weekly occurrences)',
    example: 4,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Min(1)
  recurrence_count?: number;

  @ApiPropertyOptional({
    description:
      'Recurrence interval (daily, weekly, biweekly, monthly, quarterly, yearly)',
    example: 'weekly',
  })
  @IsOptional()
  @IsString()
  @IsIn(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'])
  recurrence_interval?: string;

  @ApiProperty({
    description: 'Preferred scheduled date (YYYY-MM-DD)',
    example: '2026-02-01',
  })
  @IsNotEmpty()
  @IsDateString()
  scheduled_date: string;

  @ApiPropertyOptional({
    description: 'Preferred start time (HH:mm:ss)',
    example: '09:00:00',
  })
  @IsOptional()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'scheduled_start_time must be in HH:mm:ss format',
  })
  scheduled_start_time?: string;

  @ApiPropertyOptional({
    description:
      'Service address ID (required for home_service, optional for walk_in/remote)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  service_address_id?: number;

  @ApiPropertyOptional({
    description: 'Service address as text (if not using address ID)',
    example: '123 Main St, City, Province',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  service_address_text?: string;

  @ApiPropertyOptional({
    description: 'Service location latitude',
    example: 14.5995,
  })
  @IsOptional()
  @IsNumber()
  service_latitude?: number;

  @ApiPropertyOptional({
    description: 'Service location longitude',
    example: 120.9842,
  })
  @IsOptional()
  @IsNumber()
  service_longitude?: number;

  @ApiPropertyOptional({
    description: 'Appointment location type',
    enum: AppointmentLocationTypeEnum,
    default: AppointmentLocationTypeEnum.HOME_SERVICE,
  })
  @IsOptional()
  @IsEnum(AppointmentLocationTypeEnum)
  appointment_location_type?: AppointmentLocationTypeEnum;

  @ApiPropertyOptional({
    description: 'Customer notes for the booking request',
    example: 'Please bring extra materials',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  customer_notes?: string;
}
