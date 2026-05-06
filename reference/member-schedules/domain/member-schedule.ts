import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { SellerMember } from '@/seller-members/domain/seller-member';
import { User } from '@/users/domain/user';

export class MemberSchedule {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number, description: 'Seller member ID' })
  seller_member_id: number;

  @ApiProperty({ type: Number, description: '0=Sunday ... 6=Saturday' })
  day_of_week: number;

  @ApiProperty({ type: String, default: 'Active' })
  status: string;

  @ApiPropertyOptional({ type: String, example: '09:00:00', nullable: true })
  start_time?: string | null;

  @ApiPropertyOptional({ type: String, example: '18:00:00', nullable: true })
  end_time?: string | null;

  @ApiPropertyOptional({ type: String, example: '12:00:00', nullable: true })
  break_start?: string | null;

  @ApiPropertyOptional({ type: String, example: '13:00:00', nullable: true })
  break_end?: string | null;

  @ApiPropertyOptional({ type: () => SellerMember, nullable: true })
  seller_member?: SellerMember | null;

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
