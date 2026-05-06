import { Module } from '@nestjs/common';
import { UserAddressesPersistenceModule } from './persistence/persistence.module';
import { UserAddressesService } from './user-addresses.service';
import { UserAddressesController } from './user-addresses.controller';

@Module({
  imports: [UserAddressesPersistenceModule],
  controllers: [UserAddressesController],
  providers: [UserAddressesService],
  exports: [UserAddressesService],
})
export class UserAddressesModule {}
