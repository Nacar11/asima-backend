import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { ServicePackageStatusEnum } from '@/service-packages/enums/service-package-status.enum';
import { User } from '@/users/domain/user';
import { Service } from '@/services/domain/service';

export class ServicePackage {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number })
  service_id: number;

  @ApiProperty({ type: String, example: 'Standard Package' })
  name: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description?: string | null;

  @ApiProperty({ type: Number, example: 1999.99 })
  price: number;

  @ApiPropertyOptional({ type: Number, example: 2499.99 })
  compare_at_price?: number | null;

  @ApiPropertyOptional({ type: Number, example: 120 })
  duration_minutes?: number | null;

  @ApiPropertyOptional({
    description: 'Array of inclusions',
    example: [{ name: 'Deep cleaning', quantity: 1 }],
    type: Object,
    nullable: true,
  })
  inclusions?: any | null;

  @ApiPropertyOptional({ type: Number, example: 5 })
  max_bookings_per_day?: number | null;

  @ApiProperty({ type: Boolean, default: false })
  is_popular: boolean;

  @ApiProperty({ type: Number, default: 0 })
  display_order: number;

  @ApiProperty({
    enum: ServicePackageStatusEnum,
    default: ServicePackageStatusEnum.ACTIVE,
  })
  status: ServicePackageStatusEnum;

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
