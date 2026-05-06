import { PartialType } from '@nestjs/swagger';
import { CreateSubSectionDto } from '@/masters/sub-sections/dto/create-sub-section.dto';

/**
 * Data Transfer Object for updating existing sub-sections.
 *
 * This DTO extends the CreateSubSectionDto with all fields optional,
 * allowing partial updates of sub-section properties. It maintains
 * the same validation rules as the create DTO but makes all fields
 * optional for flexible updates.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 */
export class UpdateSubSectionDto extends PartialType(CreateSubSectionDto) {}
