import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubmissionValueDto {
  @ApiProperty({ type: Number, example: 1 })
  @Type(() => Number)
  @IsInt()
  form_template_id: number;

  @ApiProperty({ type: String, example: 'quantity' })
  @IsNotEmpty()
  @IsString()
  field_code: string;

  @ApiPropertyOptional({ type: String, example: '5' })
  @IsOptional()
  @IsString()
  value?: string | null;
}
