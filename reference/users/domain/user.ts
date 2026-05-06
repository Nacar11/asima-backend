import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CostCenter } from '@/cost-centers/domain/cost-center';
import { Seller } from '@/sellers/domain/seller';
import { StatusEnum } from '../users.enum';
import { GenderEnum } from '@/user-details/domain/user-detail';
import { UserAddress } from '@/user-addresses/domain/user-address';
import { UserAssignment } from '@/user-assignments/domain/user-assignment';
export class User {
  @ApiProperty({
    type: Number,
  })
  id: number;

  @ApiProperty({
    type: String,
    example: null,
  })
  user_id?: string | null;

  @Exclude({ toPlainOnly: true })
  salt?: string;

  @ApiProperty({
    type: Boolean,
    example: false,
  })
  system_admin?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    nullable: true,
    description: 'Whether this user record is a guest (anonymous web flow)',
  })
  is_guest?: boolean;

  @ApiProperty({
    type: String,
    example: 'john.doe@cody.inc',
  })
  // @Expose({ groups: ['me', 'admin'] })
  email: string | null;

  @Exclude({ toPlainOnly: true })
  password?: string;

  @Exclude({ toPlainOnly: true })
  device_pin?: string;

  @ApiProperty({
    type: String,
    example: 'John',
  })
  first_name: string | null;

  @ApiProperty({
    type: String,
    example: null,
  })
  middle_name?: string | null;

  @ApiProperty({
    type: String,
    example: 'Doe',
  })
  last_name: string | null;

  @ApiProperty({
    type: String,
    example: null,
  })
  suffix?: string | null;

  @ApiPropertyOptional({
    type: String,
    example:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII',
    nullable: true,
  })
  image?: string | null;

  @ApiProperty({
    type: () => CostCenter,
    nullable: true,
    example: { id: 1, cost_center_code: '00', cost_center_name: '00 / CODY' },
  })
  cost_center?: CostCenter | null;

  @ApiProperty({
    type: () => Seller,
    nullable: true,
    example: { id: 1, store_name: 'Tech Store' },
  })
  seller?: Seller | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 1,
    description: 'Seller ID extracted from seller object for convenience',
  })
  seller_id?: number | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '+1234567890',
    description: 'Primary phone number',
  })
  phone?: string | null;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Flag if email has been verified',
  })
  email_verified = false;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Flag if phone number has been verified',
  })
  phone_verified = false;

  @ApiPropertyOptional({
    type: Boolean,
    nullable: true,
    description: 'Whether the user must change their password on first login',
  })
  must_change_password?: boolean;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '123 Main St, City, Country',
    description: 'Address from user details',
  })
  address?: string | null;

  @ApiPropertyOptional({
    enum: GenderEnum,
    nullable: true,
    example: GenderEnum.MALE,
    description: 'Gender from user details',
  })
  gender?: GenderEnum | null;

  @ApiPropertyOptional({
    type: Date,
    nullable: true,
    example: '1990-01-15',
    description: 'Date of birth from user details',
  })
  date_of_birth?: Date | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example:
      'https://minio-host/media/avatars/users/123/avatar-1719999999999.jpg',
    description: 'Profile picture URL from user details',
  })
  profile_picture?: string | null;

  @ApiPropertyOptional({
    type: () => UserAddress,
    nullable: true,
  })
  default_address?: UserAddress | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
  })
  default_address_id?: number | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
  })
  preferred_currency_id?: number | null;

  @ApiProperty({
    type: String,
    nullable: false,
    example: StatusEnum.ACTIVE,
  })
  status: string;

  @ApiProperty({
    type: () => User,
    nullable: false,
    example: { id: 1, first_name: 'John', last_name: 'Doe', cost_center: '00' },
  })
  created_by?: Pick<
    User,
    'id' | 'first_name' | 'last_name' | 'cost_center'
  > | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty({
    type: () => User,
    nullable: false,
    example: { id: 1, first_name: 'John', last_name: 'Doe', cost_center: '00' },
  })
  updated_by?: Pick<
    User,
    'id' | 'first_name' | 'last_name' | 'cost_center'
  > | null;

  @ApiProperty()
  updated_at: Date;

  @ApiProperty({
    type: () => User,
    nullable: true,
    example: null,
  })
  deleted_by?: Pick<
    User,
    'id' | 'first_name' | 'last_name' | 'cost_center'
  > | null;

  @ApiProperty({
    example: null,
  })
  deleted_at?: Date | null;

  @ApiPropertyOptional({
    type: Boolean,
    nullable: true,
    description: 'Whether the user is a store owner (computed, not persisted)',
  })
  is_store_owner?: boolean | null;

  @ApiPropertyOptional({
    type: () => [UserAssignment],
    nullable: true,
    description: 'User group assignments',
  })
  assignments?: UserAssignment[] | null;

  @Exclude()
  __entity?: string;
}
