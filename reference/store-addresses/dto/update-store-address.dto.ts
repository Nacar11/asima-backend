import { PartialType } from '@nestjs/swagger';
import { CreateStoreAddressDto } from './create-store-address.dto';

export class UpdateStoreAddressDto extends PartialType(CreateStoreAddressDto) {}
