import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

/**
 * DTO for updating provider notes on a booking.
 *
 * Used by sellers or assigned members to update internal notes.
 *
 * @version 1
 * @since 1.0.0
 */
export class UpdateProviderNotesDto {
  @ApiProperty({
    type: String,
    description: 'Provider notes for this booking',
    example: 'Customer prefers morning appointment. Bring extra supplies.',
    maxLength: 2000,
  })
  @IsString()
  @MaxLength(2000)
  provider_notes: string;
}
