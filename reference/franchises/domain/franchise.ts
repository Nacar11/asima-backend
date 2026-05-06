import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FranchiseStatusEnum } from './franchise-status.enum';
import { Causer } from '@/utils/domain/causer';

/**
 * Franchise domain entity
 */
export class Franchise {
  @ApiProperty({ type: Number, example: 1 })
  id: number;

  @ApiProperty({ type: String, example: 'ABC Franchise' })
  name: string;

  @ApiProperty({ type: String, example: 'John Doe' })
  owner_name: string;

  @ApiProperty({ type: String, example: 'john@example.com' })
  email: string;

  @ApiProperty({ type: String, example: '+639123456789' })
  phone: string;

  @ApiProperty({ type: String, example: '123 Main Street' })
  address_line1: string;

  @ApiPropertyOptional({ type: String, example: 'Suite 100', nullable: true })
  address_line2?: string | null;

  @ApiProperty({ type: String, example: 'Manila' })
  city: string;

  @ApiProperty({ type: String, example: 'Metro Manila' })
  state_province: string;

  @ApiProperty({ type: String, example: '1000' })
  postal_code: string;

  @ApiProperty({ type: String, example: 'Philippines', default: 'Philippines' })
  country: string;

  @ApiProperty({
    enum: FranchiseStatusEnum,
    example: FranchiseStatusEnum.SCREENING,
    default: FranchiseStatusEnum.SCREENING,
  })
  status: FranchiseStatusEnum;

  @ApiPropertyOptional({
    type: String,
    example: 'Additional notes',
    nullable: true,
  })
  notes?: string | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  onboarded_at: Date | null;

  @ApiPropertyOptional({ type: Object, nullable: true })
  created_by?: Causer | null;

  @ApiProperty()
  created_at: Date;

  @ApiPropertyOptional({ type: Object, nullable: true })
  updated_by?: Causer | null;

  @ApiProperty()
  updated_at: Date;

  @ApiPropertyOptional({ type: Object, nullable: true })
  deleted_by?: Causer | null;

  @ApiPropertyOptional({ nullable: true })
  deleted_at?: Date | null;
}
