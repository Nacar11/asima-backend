import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { SellerMember } from '@/seller-members/domain/seller-member';
import { ProficiencyLevelEnum } from '@/seller-member-services/enums/proficiency-level.enum';
import { User } from '@/users/domain/user';

export class SellerMemberService {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number })
  seller_member_id: number;

  @ApiPropertyOptional({ type: () => SellerMember, nullable: true })
  seller_member?: SellerMember | null;

  @ApiProperty({ type: Number, description: 'Service ID' })
  service_id: number;

  @ApiProperty({
    enum: ProficiencyLevelEnum,
    example: ProficiencyLevelEnum.STANDARD,
  })
  proficiency_level: ProficiencyLevelEnum;

  @ApiProperty({ type: Boolean, example: false })
  is_primary: boolean;

  @ApiProperty({ type: String, default: 'Active' })
  status: string;

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
