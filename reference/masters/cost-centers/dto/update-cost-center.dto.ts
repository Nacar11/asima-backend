import { PartialType } from '@nestjs/swagger';
import { CreateCostCenterDto } from '@/masters/cost-centers/dto/create-cost-center.dto';

/**
 * Data Transfer Object for updating an existing cost center.
 *
 * This DTO extends the CreateCostCenterDto but makes all fields optional,
 * allowing for partial updates to cost center properties. The cost center
 * code will be automatically regenerated if organizational structure changes.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * const updateDto: UpdateCostCenterDto = {
 *   remarks: 'Updated description',
 *   status: StatusEnum.HOLD
 * };
 * ```
 */
export class UpdateCostCenterDto extends PartialType(CreateCostCenterDto) {}
