import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DTO for provider responding to a dispute.
 *
 * @version 1
 * @since 1.0.0
 */
export class ProviderRespondDisputeDto {
  @ApiProperty({
    type: String,
    example: 'The service was completed as agreed. Here is my explanation...',
    description: 'Provider response text',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  response: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'URLs of counter-evidence photos/documents',
  })
  @IsOptional()
  @IsString({ each: true })
  provider_evidence_urls?: string[];
}
