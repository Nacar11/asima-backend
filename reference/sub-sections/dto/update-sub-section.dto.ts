import { PartialType } from '@nestjs/swagger';
import { CreateSubSectionDto } from '@/sub-sections/dto/create-sub-section.dto';

export class UpdateSubSectionDto extends PartialType(CreateSubSectionDto) {}
