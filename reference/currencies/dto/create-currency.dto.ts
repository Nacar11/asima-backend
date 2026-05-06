import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCurrencyDto {
  @ApiProperty({
    type: String,
    example: 'PHP',
    description: 'ISO 4217 currency code',
  })
  @IsString()
  @Length(3, 3)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  code: string;

  @ApiProperty({
    type: String,
    example: 'Philippine Peso',
  })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiPropertyOptional({
    type: String,
    example: '₱',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Length(1, 10)
  symbol?: string | null;

  @ApiPropertyOptional({
    type: Number,
    example: 1.0,
    default: 1,
    description: 'Exchange rate relative to PHP',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  exchange_rate_to_php?: number;

  @ApiPropertyOptional({
    type: String,
    example: 'Active',
    default: 'Active',
  })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  status?: string;
}
