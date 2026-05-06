import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { ShippingProviderEntity } from './persistence/entities/shipping-provider.entity';
import { ShippingZoneEntity } from './persistence/entities/shipping-zone.entity';
import { ShippingZoneAreaEntity } from './persistence/entities/shipping-zone-area.entity';
import { ShippingMethodEntity } from './persistence/entities/shipping-method.entity';
import { ShippingMethodZoneRateEntity } from './persistence/entities/shipping-method-zone-rate.entity';
import { ShippingDistanceTierEntity } from './persistence/entities/shipping-distance-tier.entity';
import { ShippingSurgeRuleEntity } from './persistence/entities/shipping-surge-rule.entity';

// Repositories
import { ShippingProviderRepository } from './persistence/repositories/shipping-provider.repository';
import { ShippingZoneRepository } from './persistence/repositories/shipping-zone.repository';
import { ShippingMethodRepository } from './persistence/repositories/shipping-method.repository';
import { ShippingDistanceTierRepository } from './persistence/repositories/shipping-distance-tier.repository';
import { ShippingZoneRateRepository } from './persistence/repositories/shipping-zone-rate.repository';

// Services
import { ShippingService } from './services/shipping.service';
import { ZoneResolverService } from './services/zone-resolver.service';
import { DistanceCalculatorService } from './services/distance-calculator.service';
import { ShippingCalculatorService } from './services/shipping-calculator.service';

// Controllers
import { AdminShippingController } from './controllers/admin-shipping.controller';
import { ShippingController } from './controllers/shipping.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ShippingProviderEntity,
      ShippingZoneEntity,
      ShippingZoneAreaEntity,
      ShippingMethodEntity,
      ShippingMethodZoneRateEntity,
      ShippingDistanceTierEntity,
      ShippingSurgeRuleEntity,
    ]),
  ],
  controllers: [AdminShippingController, ShippingController],
  providers: [
    // Repositories
    ShippingProviderRepository,
    ShippingZoneRepository,
    ShippingMethodRepository,
    ShippingDistanceTierRepository,
    ShippingZoneRateRepository,
    // Services
    ZoneResolverService,
    DistanceCalculatorService,
    ShippingCalculatorService,
    ShippingService,
  ],
  exports: [ShippingService, ZoneResolverService, DistanceCalculatorService],
})
export class ShippingModule {}
