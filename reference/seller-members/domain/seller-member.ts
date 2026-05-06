import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Seller } from '@/sellers/domain/seller';
import { User } from '@/users/domain/user';
import { SellerMemberStatusEnum } from '@/seller-members/enums/seller-member-status.enum';

export class SellerMember {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number, description: 'Seller ID' })
  seller_id: number;

  @ApiProperty({ type: () => Seller, nullable: true })
  seller?: Seller | null;

  @ApiProperty({ type: Number, description: 'User ID of member' })
  user_id: number;

  @ApiProperty({ type: () => User, nullable: true })
  user?: User | null;

  @ApiProperty({ type: String, example: 'member' })
  role: string;

  @ApiProperty({ type: Boolean, example: true })
  is_service_provider: boolean;

  @ApiProperty({ type: Number, example: 8 })
  max_daily_bookings: number;

  @ApiProperty({ type: Number, example: 1 })
  max_concurrent_bookings: number;

  @ApiProperty({ type: Number, example: 8.0 })
  service_capacity_hours: number;

  @ApiProperty({ type: Boolean, example: true })
  is_available_for_booking: boolean;

  @ApiPropertyOptional({ type: String, example: 'Jane D.' })
  display_name?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'https://example.com/member.png',
  })
  profile_image_url?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Experienced in salon services.',
  })
  bio?: string | null;

  @ApiProperty({ type: Number, example: 4.8 })
  average_rating: number;

  @ApiProperty({ type: Number, example: 0 })
  total_reviews: number;

  @ApiProperty({ type: Number, example: 0 })
  total_completed_bookings: number;

  @ApiProperty({
    enum: SellerMemberStatusEnum,
    example: SellerMemberStatusEnum.ACTIVE,
  })
  status: SellerMemberStatusEnum;

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
