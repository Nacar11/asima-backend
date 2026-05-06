import { PartialType } from '@nestjs/swagger';
import { CreateProductAttributeDto } from './create-product-attribute.dto';
import { User } from '@/users/domain/user';

export class UpdateProductAttributeDto extends PartialType(
  CreateProductAttributeDto,
) {
  deleted_by?: User;
}
