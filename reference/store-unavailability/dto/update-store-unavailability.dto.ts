import { PartialType } from '@nestjs/swagger';
import { CreateStoreUnavailabilityDto } from '@/store-unavailability/dto/create-store-unavailability.dto';

export class UpdateStoreUnavailabilityDto extends PartialType(
  CreateStoreUnavailabilityDto,
) {}
