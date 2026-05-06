import { PartialType } from '@nestjs/swagger';
import { CreateSectionDto } from '@/masters/sections/dto/create-section.dto';

/**
 * Data Transfer Object for updating a section.
 *
 * This DTO defines the optional fields that can be updated for
 * a section in the system. It extends the CreateSectionDto with
 * all fields made optional, allowing partial updates while
 * maintaining the same validation rules for provided fields.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * const updateDto = new UpdateSectionDto();
 * updateDto.section_name = 'Advanced Engineering';
 * updateDto.section_head = 456;
 * // All fields are optional for updates
 * ```
 */
export class UpdateSectionDto extends PartialType(CreateSectionDto) {}
