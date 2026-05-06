import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';

/**
 * Seller Certification domain entity
 */
export class SellerCertification {
  @ApiProperty({
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Seller ID this certification belongs to',
  })
  seller_id: number;

  @ApiProperty({
    type: String,
    example: 'AWS Solutions Architect',
    description: 'Name of the certification',
  })
  name: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Amazon Web Services',
    description: 'Issuing organization',
    nullable: true,
  })
  issuer?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'https://example.com/cert-image.jpg',
    description: 'URL to certification image',
    nullable: true,
  })
  image_url?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'AWS-123456',
    description: 'Credential ID or certificate number',
    nullable: true,
  })
  credential_id?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'https://aws.amazon.com/verification/123456',
    description: 'URL to verify the certification',
    nullable: true,
  })
  credential_url?: string | null;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
    example: '2023-01-15',
    description: 'Date the certification was issued',
    nullable: true,
  })
  issue_date?: Date | null;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
    example: '2026-01-15',
    description: 'Expiration date of the certification',
    nullable: true,
  })
  expiry_date?: Date | null;

  @ApiProperty({
    type: String,
    enum: ['Active', 'Expired', 'Revoked'],
    example: 'Active',
    default: 'Active',
  })
  status: string;

  @ApiProperty({
    type: () => User,
    nullable: true,
  })
  created_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty({
    type: () => User,
    nullable: true,
  })
  updated_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty()
  updated_at: Date;

  @ApiPropertyOptional({
    type: () => User,
    nullable: true,
  })
  deleted_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  deleted_at?: Date | null;
}
