import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { AdditionalFeeTypeEnum } from '@/service-areas/enums/additional-fee-type.enum';
import { User } from '@/users/domain/user';
import { Service } from '@/services/domain/service';
import { Seller } from '@/sellers/domain/seller';

export class ServiceArea {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({
    type: Number,
    description: 'Seller who owns this service area',
  })
  seller_id: number;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    description: '@deprecated Service-level areas deprecated. Use seller_id.',
  })
  service_id?: number | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  city?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  province?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  postal_code?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  barangay?: string | null;

  @ApiPropertyOptional({ type: Number, format: 'float', example: 14.5995 })
  center_latitude?: number | null;

  @ApiPropertyOptional({ type: Number, format: 'float', example: 120.9842 })
  center_longitude?: number | null;

  @ApiPropertyOptional({ type: Number, example: 10 })
  radius_km?: number | null;

  @ApiProperty({ type: Number, example: 0, default: 0 })
  additional_fee: number;

  @ApiPropertyOptional({ type: Number, nullable: true })
  additional_fee_amount?: number | null;

  @ApiProperty({
    enum: AdditionalFeeTypeEnum,
    example: AdditionalFeeTypeEnum.FIXED,
    default: AdditionalFeeTypeEnum.FIXED,
  })
  additional_fee_type: AdditionalFeeTypeEnum;

  @ApiPropertyOptional({ type: Number, example: 500 })
  minimum_order_amount?: number | null;

  @ApiProperty({ type: String, default: 'Active' })
  status: string;

  @ApiProperty({ type: Boolean, default: true })
  is_active: boolean;

  @ApiPropertyOptional({ type: () => Seller, nullable: true })
  seller?: Seller | null;

  @ApiPropertyOptional({
    type: () => Service,
    nullable: true,
    description: '@deprecated Use seller instead',
  })
  service?: Service | null;

  @ApiPropertyOptional({ type: () => User, nullable: true })
  created_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty()
  created_at: Date;

  @ApiPropertyOptional({ type: () => User, nullable: true })
  updated_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty()
  updated_at: Date;

  @ApiPropertyOptional({ type: () => User, nullable: true })
  deleted_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiPropertyOptional()
  deleted_at?: Date | null;

  @Exclude()
  __entity?: string;
}
