import { PartialType } from '@nestjs/swagger';
import { CreateCostCenterDto } from '@/cost-centers/dto/create-cost-center.dto';

/**
 * Update Cost Center Data Transfer Object
 *
 * DTO for updating existing cost centers. Extends CreateCostCenterDto with
 * all fields made optional, allowing partial updates to cost center data.
 *
 * When updating organizational hierarchy (division, department, section, sub_section),
 * the cost center code will be automatically regenerated based on the new values.
 *
 * @example
 * ```typescript
 * const updateDto: UpdateCostCenterDto = {
 *   remarks: 'Updated description for Backend Development Team',
 *   status: StatusEnum.CANCELLED
 * };
 * ```
 *
 * @author Cody Inc Development Team
 * @since 1.0.0
 */
export class UpdateCostCenterDto extends PartialType(CreateCostCenterDto) {}
