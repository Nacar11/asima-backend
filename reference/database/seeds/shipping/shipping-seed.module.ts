import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShippingSeedService } from './shipping-seed.service';
import { ShippingProviderEntity } from '@/shipping/persistence/entities/shipping-provider.entity';
import { ShippingMethodEntity } from '@/shipping/persistence/entities/shipping-method.entity';
import { ShippingZoneEntity } from '@/shipping/persistence/entities/shipping-zone.entity';
import { ShippingZoneAreaEntity } from '@/shipping/persistence/entities/shipping-zone-area.entity';
import { ShippingDistanceTierEntity } from '@/shipping/persistence/entities/shipping-distance-tier.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ShippingProviderEntity,
      ShippingMethodEntity,
      ShippingZoneEntity,
      ShippingZoneAreaEntity,
      ShippingDistanceTierEntity,
      UserEntity,
    ]),
  ],
  providers: [ShippingSeedService],
  exports: [ShippingSeedService],
})
export class ShippingSeedModule {}
