import { BaseMasterDomain } from '@/utils/domain/base-master.domain';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Company extends BaseMasterDomain {
  @ApiProperty({
    type: String,
  })
  company_name: string;

  @ApiProperty({
    type: String,
  })
  short_name: string;

  @ApiProperty({
    type: String,
  })
  company_description?: string;

  @ApiProperty({
    type: String,
    maxLength: 15,
  })
  tin?: string;

  @ApiProperty({
    type: () => Date,
  })
  date_of_establishment: Date;

  @ApiProperty({
    type: Boolean,
    example: false,
  })
  is_main: boolean;

  @ApiProperty({
    type: String,
  })
  address1: string;

  @ApiPropertyOptional({
    type: String,
  })
  address2?: string;

  @ApiProperty({
    type: String,
  })
  telephone: string;

  @ApiProperty({
    type: String,
  })
  email: string;

  @ApiProperty({
    type: () => Date,
  })
  fiscal_year_start: Date;

  @ApiProperty({
    type: () => Date,
  })
  fiscal_year_end: Date;

  @ApiProperty({
    type: () => Date,
  })
  month_start: Date;

  @ApiProperty({
    type: () => Date,
  })
  month_end: Date;

  @ApiProperty({
    type: () => Date,
  })
  prev_month_start: Date;

  @ApiProperty({
    type: () => Date,
  })
  prev_month_end: Date;

  @ApiProperty({
    type: () => Date,
  })
  next_month_start: Date;

  @ApiProperty({
    type: () => Date,
  })
  next_month_end: Date;

  @ApiProperty({
    type: Boolean,
  })
  cylce_opening_backup: boolean;

  @ApiProperty({
    type: Boolean,
  })
  cycle_opening: boolean;

  @ApiProperty({
    type: Boolean,
  })
  cycle_closing: boolean;

  @ApiProperty({
    type: Boolean,
  })
  cycle_closing_backup: boolean;

  @ApiProperty({
    type: Boolean,
  })
  inventory_opening: boolean;

  @ApiProperty({
    type: Boolean,
  })
  inventory_closing: boolean;

  @ApiPropertyOptional({
    type: String,
  })
  logo?: string;
}
