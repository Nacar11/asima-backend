import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Causer } from '@/utils/domain/causer';

/**
 * Membership voucher configuration domain model.
 */
export class MembershipVoucherConfiguration {
  @ApiProperty({ type: Number, example: 1 })
  id: number;
  @ApiProperty({ type: Number, example: 1 })
  membership_plan_id: number;
  @ApiProperty({ type: Number, example: 5 })
  voucher_id: number;
  @ApiPropertyOptional({ type: String, nullable: true, example: 'ADMNFIX80' })
  voucher_code?: string | null;
  @ApiProperty({ type: Number, example: 1 })
  quantity: number;
  @ApiProperty({ type: Boolean, example: true })
  is_active: boolean;
  @ApiPropertyOptional({ type: () => Object, nullable: true })
  created_by?: Causer | null;
  @ApiProperty({ type: Date })
  created_at: Date;
  @ApiPropertyOptional({ type: () => Object, nullable: true })
  updated_by?: Causer | null;
  @ApiProperty({ type: Date })
  updated_at: Date;
  @ApiPropertyOptional({ type: () => Object, nullable: true })
  deleted_by?: Causer | null;
  @ApiPropertyOptional({ type: Date, nullable: true })
  deleted_at?: Date | null;
  @Exclude()
  __entity?: string;
}
