import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';

export class BulkModerateServicesDto {
  @ApiProperty({
    description: 'Array of service IDs to moderate',
    type: [Number],
    example: [1, 2, 3],
    minItems: 1,
    maxItems: 100,
  })
  @IsArray({ message: 'ids must be an array' })
  @IsNotEmpty({ message: 'ids array cannot be empty' })
  @ArrayMinSize(1, { message: 'At least one service ID must be provided' })
  @ArrayMaxSize(100, {
    message: 'Cannot moderate more than 100 services at once',
  })
  @IsInt({ each: true, message: 'Each ID must be a valid integer' })
  @Min(1, { each: true, message: 'Each ID must be a positive integer' })
  ids: number[];

  @ApiPropertyOptional({
    description:
      'Reason or notes for moderation action (applied to all services)',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
