import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';

/**
 * Bank domain entity
 */
export class Bank {
  @ApiProperty({
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    type: String,
    example: 'BPI',
    description: 'Unique bank code identifier',
  })
  bank_code: string;

  @ApiProperty({
    type: String,
    example: 'Bank of the Philippine Islands',
    description: 'Full bank name',
  })
  bank_name: string;

  @ApiPropertyOptional({
    type: String,
    example: 'https://example.com/logos/bpi.png',
    nullable: true,
    description: 'URL to bank logo image',
  })
  logo_url?: string | null;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Whether the bank is active and available for selection',
  })
  is_active: boolean;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Display order for sorting in dropdowns',
  })
  display_order: number;

  @ApiProperty({
    type: () => User,
    nullable: true,
    example: { id: 1, first_name: 'Admin', last_name: 'User' },
  })
  created_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty({
    type: () => User,
    nullable: true,
    example: { id: 1, first_name: 'Admin', last_name: 'User' },
  })
  updated_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty()
  updated_at: Date;

  @ApiPropertyOptional({
    type: () => User,
    nullable: true,
    example: null,
  })
  deleted_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
  })
  deleted_at?: Date | null;

  @Exclude()
  __entity?: string;
}
