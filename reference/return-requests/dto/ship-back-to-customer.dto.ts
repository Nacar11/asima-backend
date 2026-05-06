import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

export class ShipBackToCustomerDto {
  @ApiProperty({
    description: 'Tracking number for the return shipment to customer',
    example: 'TRK-123456789',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  tracking_number: string;

  @ApiPropertyOptional({
    description: 'Carrier/courier name',
    example: 'J&T Express',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  carrier?: string;

  @ApiPropertyOptional({
    description: 'Additional notes about the shipment',
    example: 'Item being returned due to failed inspection',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
