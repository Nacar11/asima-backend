import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Causer } from '@/utils/domain/causer';

export class MembershipVoucherGrant {
  @ApiProperty({ type: Number, example: 1 })
  id: number;
  @ApiProperty({ type: Number, example: 1 })
  membership_id: number;
  @ApiProperty({ type: Number, example: 15 })
  user_id: number;
  @ApiProperty({ type: Number, example: 1 })
  membership_payment_id: number;
  @ApiProperty({ type: Number, example: 5 })
  voucher_id: number;
  @ApiProperty({ type: String, example: 'WELCOME-FOOD-10PCT' })
  voucher_code: string;
  @ApiPropertyOptional({ type: String, example: 'global', nullable: true })
  grant_type?: string | null;
  @ApiPropertyOptional({ type: Number, example: 3, nullable: true })
  quantity?: number | null;
  @ApiPropertyOptional({ type: () => Object, nullable: true })
  created_by?: Causer | null;
  @ApiProperty()
  created_at: Date;
  @ApiPropertyOptional({ type: () => Object, nullable: true })
  updated_by?: Causer | null;
  @ApiProperty()
  updated_at: Date;
  @ApiPropertyOptional({ type: () => Object, nullable: true })
  deleted_by?: Causer | null;
  @ApiPropertyOptional({ type: Date, nullable: true })
  deleted_at?: Date | null;
  @Exclude()
  __entity?: string;
}
