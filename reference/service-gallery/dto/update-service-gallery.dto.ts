import { PartialType } from '@nestjs/swagger';
import { CreateServiceGalleryDto } from './create-service-gallery.dto';

export class UpdateServiceGalleryDto extends PartialType(
  CreateServiceGalleryDto,
) {}
