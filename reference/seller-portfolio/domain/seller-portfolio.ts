import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/users/domain/user';

/**
 * Seller Portfolio domain entity
 */
export class SellerPortfolio {
  @ApiProperty({
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Seller ID this portfolio item belongs to',
  })
  seller_id: number;

  @ApiProperty({
    type: String,
    example: 'Website Redesign Project',
    description: 'Title of the portfolio item',
  })
  title: string;

  @ApiPropertyOptional({
    type: String,
    example: 'A complete redesign of an e-commerce website...',
    description: 'Description of the portfolio item',
    nullable: true,
  })
  description?: string | null;

  @ApiProperty({
    type: String,
    example: 'https://example.com/portfolio-image.jpg',
    description: 'URL to the portfolio image',
  })
  image_url: string;

  @ApiPropertyOptional({
    type: String,
    example: 'https://example.com/project-link',
    description: 'URL to the project or more details',
    nullable: true,
  })
  project_url?: string | null;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Display order for sorting',
    default: 0,
  })
  display_order?: number;

  @ApiProperty({
    type: String,
    enum: ['Active', 'Inactive'],
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
