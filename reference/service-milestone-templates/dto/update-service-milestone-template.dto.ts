import { PartialType } from '@nestjs/swagger';
import { CreateServiceMilestoneTemplateDto } from './create-service-milestone-template.dto';

export class UpdateServiceMilestoneTemplateDto extends PartialType(
  CreateServiceMilestoneTemplateDto,
) {}
