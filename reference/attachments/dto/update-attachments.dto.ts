import { PartialType } from '@nestjs/swagger';
import { CreateAttachmentsDto } from '@/attachments/dto/create-attachments.dto';

export class UpdateAttachmentsDto extends PartialType(CreateAttachmentsDto) {}
