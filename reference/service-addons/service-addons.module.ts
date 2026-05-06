import { Module } from '@nestjs/common';
import { ServiceAddonsService } from '@/service-addons/service-addons.service';
import { ServiceAddonsController } from '@/service-addons/service-addons.controller';
import { ServiceAddonPersistenceModule } from '@/service-addons/persistence/persistence.module';
import { ServicesModule } from '@/services/services.module';

/**
 * Service Addons Module.
 *
 * @deprecated This module is deprecated. Use FormTemplatesModule instead.
 * Form templates with field_type = 'checkbox' can replace addon functionality.
 * This module is kept for backward compatibility with existing data
 * but should not be used for new implementations.
 *
 * Migration guide:
 * - Service addons → Form templates with field_type = 'checkbox'
 * - Addon pricing → Form template options with price_adjustment
 *
 * @see FormTemplatesModule
 */
@Module({
  imports: [ServiceAddonPersistenceModule, ServicesModule],
  controllers: [ServiceAddonsController],
  providers: [ServiceAddonsService],
  exports: [ServiceAddonsService, ServiceAddonPersistenceModule],
})
export class ServiceAddonsModule {}
