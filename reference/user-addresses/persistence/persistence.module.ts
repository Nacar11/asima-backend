import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAddressRepository } from './repositories/user-address.repository';
import { BaseUserAddressRepository } from './base-user-address.repository';
import { UserAddressEntity } from './entities/user-address.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserAddressEntity])],
  providers: [
    {
      provide: BaseUserAddressRepository,
      useClass: UserAddressRepository,
    },
  ],
  exports: [BaseUserAddressRepository],
})
export class UserAddressesPersistenceModule {}
