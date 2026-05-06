import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { User } from '@/users/domain/user';
import { Service } from '@/services/domain/service';

export class ServiceGallery {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number })
  service_id: number;

  @ApiProperty({ type: String, example: 'https://example.com/image.jpg' })
  image_url: string;

  @ApiPropertyOptional({ type: String })
  caption?: string | null;

  @ApiPropertyOptional({ type: String })
  alt_text?: string | null;

  @ApiProperty({ type: Boolean, default: false })
  is_primary: boolean;

  @ApiProperty({ type: Number, default: 0 })
  display_order: number;

  @ApiProperty({ type: String, default: 'Active' })
  status: string;

  @ApiPropertyOptional({ type: () => Service, nullable: true })
  service?: Service | null;

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
