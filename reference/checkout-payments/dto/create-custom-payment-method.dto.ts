import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCustomPaymentMethodDto {
  @ApiProperty({ example: 'Bank Transfer — BDO' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Transfer to BDO account and upload proof.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/bdo-logo.png' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  icon_url?: string | null;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/bdo-qr.png' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  qr_image_url?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  is_enabled?: boolean;

  @ApiPropertyOptional({ default: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}
