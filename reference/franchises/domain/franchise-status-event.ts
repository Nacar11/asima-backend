import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FranchiseStatusEnum } from './franchise-status.enum';
import { Causer } from '@/utils/domain/causer';

/**
 * Franchise status event domain entity for audit trail
 */
export class FranchiseStatusEvent {
  @ApiProperty({ type: Number, example: 1 })
  id: number;

  @ApiProperty({ type: Number, example: 1 })
  franchise_id: number;

  @ApiPropertyOptional({
    enum: FranchiseStatusEnum,
    nullable: true,
    example: FranchiseStatusEnum.SCREENING,
  })
  previous_status?: FranchiseStatusEnum | null;

  @ApiProperty({
    enum: FranchiseStatusEnum,
    example: FranchiseStatusEnum.ACTIVE,
  })
  new_status: FranchiseStatusEnum;

  @ApiPropertyOptional({ type: String, nullable: true })
  description?: string | null;

  @ApiPropertyOptional({ type: Object, nullable: true })
  created_by?: Causer | null;

  @ApiProperty()
  created_at: Date;
}
