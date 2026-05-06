import { Module } from '@nestjs/common';
import { StoreAddressesPersistenceModule } from './persistence/persistence.module';
import { StoreAddressesService } from './store-addresses.service';
import { StoreAddressesController } from './store-addresses.controller';

@Module({
  imports: [StoreAddressesPersistenceModule],
  controllers: [StoreAddressesController],
  providers: [StoreAddressesService],
  exports: [StoreAddressesService],
})
export class StoreAddressesModule {}
