import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
  IsDateString,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

function IsFutureDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isFutureDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (!value) return false;
          const pickupDate = new Date(value as string);
          const now = new Date();
          // Set time to start of day for comparison
          now.setHours(0, 0, 0, 0);
          pickupDate.setHours(0, 0, 0, 0);
          return pickupDate >= now;
        },
        defaultMessage() {
          return 'Pickup date must be today or a future date';
        },
      },
    });
  };
}

export class SchedulePickupDto {
  @ApiProperty({
    description:
      'Scheduled pickup date and time (must be today or in the future)',
    example: '2024-12-20T10:00:00.000Z',
  })
  @IsNotEmpty()
  @IsDateString()
  @IsFutureDate()
  pickup_date: string;

  @ApiPropertyOptional({
    description: 'Notes for the pickup driver',
    example: 'Please call customer before arriving. Gate code: 1234',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  notes?: string;
}
