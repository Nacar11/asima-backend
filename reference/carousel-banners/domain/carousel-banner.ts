import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';
import { Media } from '@/media/domain/media';

export class CarouselBanner {
  @ApiProperty({ type: Number, example: 1 })
  id: number;

  @ApiProperty({ type: Number, example: 1 })
  media_id: number;

  @ApiPropertyOptional({ type: () => Media, nullable: true })
  media?: Media | null;

  @ApiProperty({ type: String, example: 'Big Sale' })
  headline: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Up to 50% off',
    nullable: true,
  })
  subtext?: string | null;

  @ApiProperty({ type: String, example: 'Shop Now' })
  cta_text: string;

  @ApiProperty({ type: String, example: '/products' })
  cta_link: string;

  @ApiProperty({ type: Number, example: 0 })
  display_order: number;

  @ApiProperty({ type: Boolean, example: true })
  is_active: boolean;

  @ApiPropertyOptional({ type: () => Date, nullable: true })
  start_at?: Date | null;

  @ApiPropertyOptional({ type: () => Date, nullable: true })
  end_at?: Date | null;

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

  @ApiPropertyOptional({ type: () => User, nullable: true, example: null })
  deleted_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  deleted_at?: Date | null;

  @Exclude()
  __entity?: string;
}
