import { PartialType } from '@nestjs/swagger';
import { CreateDistanceTierDto } from './create-distance-tier.dto';

/**
 * DTO for updating a shipping distance tier
 */
export class UpdateDistanceTierDto extends PartialType(CreateDistanceTierDto) {}
