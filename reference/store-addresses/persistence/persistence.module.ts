import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreAddressEntity } from './entities/store-address.entity';
import { BaseStoreAddressRepository } from './base-store-address.repository';
import { StoreAddressRepository } from './repositories/store-address.repository';

@Module({
  imports: [TypeOrmModule.forFeature([StoreAddressEntity])],
  providers: [
    {
      provide: BaseStoreAddressRepository,
      useClass: StoreAddressRepository,
    },
  ],
  exports: [BaseStoreAddressRepository],
})
export class StoreAddressesPersistenceModule {}
