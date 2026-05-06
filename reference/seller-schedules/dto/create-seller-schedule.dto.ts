import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

const TIME_REGEX =
  /^(?:([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?|24:00(?::00)?)$/;

export class CreateSellerScheduleDto {
  @ApiProperty({ type: Number, example: 1, description: 'Seller ID' })
  @Type(() => Number)
  @IsInt()
  seller_id: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: '0 = Sunday, 6 = Saturday',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  day_of_week: number;

  @ApiPropertyOptional({ type: String, default: 'Active' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;

  @ApiPropertyOptional({ type: String, example: '09:00:00' })
  @IsOptional()
  @Matches(TIME_REGEX, {
    message: 'start_time must be in HH:mm or HH:mm:ss format',
  })
  start_time?: string | null;

  @ApiPropertyOptional({ type: String, example: '18:00:00' })
  @IsOptional()
  @Matches(TIME_REGEX, {
    message: 'end_time must be in HH:mm or HH:mm:ss format',
  })
  end_time?: string | null;

  @ApiPropertyOptional({ type: String, example: '12:00:00' })
  @IsOptional()
  @Matches(TIME_REGEX, {
    message: 'break_start must be in HH:mm or HH:mm:ss format',
  })
  break_start?: string | null;

  @ApiPropertyOptional({ type: String, example: '13:00:00' })
  @IsOptional()
  @Matches(TIME_REGEX, {
    message: 'break_end must be in HH:mm or HH:mm:ss format',
  })
  break_end?: string | null;
}
