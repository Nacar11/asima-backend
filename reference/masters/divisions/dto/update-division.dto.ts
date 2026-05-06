import { PartialType } from '@nestjs/swagger';
import { CreateDivisionDto } from '@/masters/divisions/dto/create-division.dto';

/**
 * Data Transfer Object for updating an existing division.
 *
 * This DTO defines the optional fields that can be updated for
 * a division in the system. It extends the CreateDivisionDto with
 * all fields being optional, allowing partial updates while
 * maintaining the same validation rules.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * const updateDto: UpdateDivisionDto = {
 *   division_name: 'Advanced Engineering',
 *   division_head: 456,
 *   status: 'Active'
 * };
 * ```
 */
export class UpdateDivisionDto extends PartialType(CreateDivisionDto) {}
