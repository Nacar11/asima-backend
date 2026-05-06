import { PartialType } from '@nestjs/swagger';
import { CreateRatingTemplateDto } from './create-rating-template.dto';

/**
 * DTO for updating a rating template.
 */
export class UpdateRatingTemplateDto extends PartialType(
  CreateRatingTemplateDto,
) {}
