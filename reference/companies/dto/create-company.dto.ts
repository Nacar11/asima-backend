import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({
    type: String,
    example: 'Cody Web Development Inc.',
  })
  @IsNotEmpty()
  @IsString()
  company_name: string;

  @ApiProperty({
    type: String,
    example: 'CODY',
  })
  @IsNotEmpty()
  @IsString()
  short_name: string;

  @ApiPropertyOptional({
    type: String,
    example: 'A web development company.',
  })
  @IsOptional()
  @IsString()
  company_description?: string;

  @ApiPropertyOptional({
    type: String,
    example: '123-456-789',
    maxLength: 15,
  })
  @IsOptional()
  @IsString()
  tin?: string;

  @ApiPropertyOptional({
    type: () => Date,
  })
  @IsOptional()
  date_of_establishment?: Date;

  @ApiProperty({
    type: Boolean,
    example: false,
  })
  @IsNotEmpty()
  is_main: boolean;

  @ApiProperty({
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  address1: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  address2?: string;

  @ApiProperty({
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  telephone: string;

  @ApiProperty({
    type: String,
    example: 'sample@gmail.com',
  })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    type: () => Date,
  })
  @IsNotEmpty()
  @IsDateString()
  fiscal_year_start: Date;

  @ApiProperty({
    type: () => Date,
  })
  @IsNotEmpty()
  @IsDateString()
  fiscal_year_end: Date;

  @ApiProperty({
    type: () => Date,
  })
  @IsNotEmpty()
  @IsDateString()
  month_start: Date;

  @ApiProperty({
    type: () => Date,
  })
  @IsNotEmpty()
  @IsDateString()
  month_end: Date;

  @ApiProperty({
    type: () => Date,
  })
  @IsNotEmpty()
  @IsDateString()
  prev_month_start: Date;

  @ApiProperty({
    type: () => Date,
  })
  @IsNotEmpty()
  @IsDateString()
  prev_month_end: Date;

  @ApiProperty({
    type: () => Date,
  })
  @IsNotEmpty()
  @IsDateString()
  next_month_start: Date;

  @ApiProperty({
    type: () => Date,
  })
  @IsNotEmpty()
  @IsDateString()
  next_month_end: Date;

  @ApiProperty({
    type: Boolean,
  })
  @IsNotEmpty()
  cycle_opening_backup: boolean;

  @ApiProperty({
    type: Boolean,
  })
  @IsNotEmpty()
  cycle_opening: boolean;

  @ApiProperty({
    type: Boolean,
  })
  @IsNotEmpty()
  cycle_closing: boolean;

  @ApiProperty({
    type: Boolean,
  })
  @IsNotEmpty()
  cycle_closing_backup: boolean;

  @ApiProperty({
    type: Boolean,
  })
  @IsNotEmpty()
  inventory_opening: boolean;

  @ApiProperty({
    type: Boolean,
  })
  @IsNotEmpty()
  inventory_closing: boolean;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  logo?: string;
}
