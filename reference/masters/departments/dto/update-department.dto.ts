import { PartialType } from '@nestjs/swagger';
import { CreateDepartmentDto } from '@/masters/departments/dto/create-department.dto';

/**
 * Data Transfer Object for updating department information.
 *
 * This DTO extends the CreateDepartmentDto using PartialType, making all
 * fields optional for partial updates. It's used for PATCH operations
 * where only specific fields need to be updated rather than replacing
 * the entire department record.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * // Update only the department name
 * const updateDto: UpdateDepartmentDto = {
 *   department_name: 'Updated IT Department'
 * };
 *
 * // Update multiple fields
 * const updateDto: UpdateDepartmentDto = {
 *   department_name: 'New Department Name',
 *   status: StatusEnum.HOLD
 * };
 * ```
 */
export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}
