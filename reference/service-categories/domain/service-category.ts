import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { User } from '@/users/domain/user';

export class ServiceCategory {
  @ApiProperty({ type: Number })
  id: number;

  @ApiPropertyOptional({ type: Number, nullable: true })
  parent_id?: number | null;

  @ApiPropertyOptional({ type: () => ServiceCategory, nullable: true })
  parent?: ServiceCategory | null;

  @ApiProperty({ type: String, example: 'Cleaning' })
  name: string;

  @ApiProperty({ type: String, example: 'cleaning' })
  code: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  icon_url?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  image_url?: string | null;

  @ApiProperty({ type: Number, example: 0 })
  level: number;

  @ApiProperty({ type: Number, example: 0 })
  display_order: number;

  @ApiProperty({ type: Boolean, example: true })
  is_active: boolean;

  @ApiProperty({ type: Boolean, example: false })
  is_featured: boolean;

  @ApiProperty({
    type: String,
    example: 'Active',
    enum: ['Active', 'Inactive'],
  })
  status: string;

  @ApiProperty({
    type: Number,
    example: 10.0,
    description: 'Default platform fee percent',
  })
  default_platform_fee_percent: number;

  @ApiPropertyOptional({ type: String, nullable: true })
  meta_title?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  meta_description?: string | null;

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
