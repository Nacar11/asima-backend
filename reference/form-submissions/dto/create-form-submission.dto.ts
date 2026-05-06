import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSubmissionValueDto } from './create-submission-value.dto';

export class CreateFormSubmissionDto {
  @ApiProperty({ type: Number, example: 1 })
  @Type(() => Number)
  @IsInt()
  service_id: number;

  @ApiPropertyOptional({
    type: Number,
    example: null,
    description: 'Booking ID if already created',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  booking_id?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: null,
    description: 'Quotation ID if already created',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  quotation_id?: number | null;

  @ApiProperty({
    type: [CreateSubmissionValueDto],
    description: 'Form field values',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSubmissionValueDto)
  values: CreateSubmissionValueDto[];
}
