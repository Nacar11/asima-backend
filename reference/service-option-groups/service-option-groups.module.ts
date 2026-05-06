import { Module } from '@nestjs/common';
import { ServiceOptionGroupsService } from '@/service-option-groups/service-option-groups.service';
import { ServiceOptionGroupsController } from '@/service-option-groups/service-option-groups.controller';
import { ServiceOptionGroupPersistenceModule } from '@/service-option-groups/persistence/persistence.module';
import { ServicesModule } from '@/services/services.module';

/**
 * Service Option Groups Module.
 *
 * @deprecated This module is deprecated. Use FormTemplatesModule instead.
 * Form templates provide a more flexible way to define customizable fields
 * for service bookings. This module is kept for backward compatibility
 * with existing data but should not be used for new implementations.
 *
 * Migration guide:
 * - Service option groups → Form templates with field_type = 'dropdown' or 'radio'
 * - Service option values → Form template options
 *
 * @see FormTemplatesModule
 */
@Module({
  imports: [ServiceOptionGroupPersistenceModule, ServicesModule],
  controllers: [ServiceOptionGroupsController],
  providers: [ServiceOptionGroupsService],
  exports: [ServiceOptionGroupsService, ServiceOptionGroupPersistenceModule],
})
export class ServiceOptionGroupsModule {}
