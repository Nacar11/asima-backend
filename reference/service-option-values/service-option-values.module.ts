import { Module } from '@nestjs/common';
import { ServiceOptionValuesService } from '@/service-option-values/service-option-values.service';
import { ServiceOptionValuesController } from '@/service-option-values/service-option-values.controller';
import { ServiceOptionValuePersistenceModule } from '@/service-option-values/persistence/persistence.module';
import { ServiceOptionGroupsModule } from '@/service-option-groups/service-option-groups.module';

/**
 * Service Option Values Module.
 *
 * @deprecated This module is deprecated. Use FormTemplatesModule with form_template_options instead.
 * Form templates provide a more flexible way to define dropdown/radio options
 * for service bookings. This module is kept for backward compatibility
 * with existing data but should not be used for new implementations.
 *
 * @see FormTemplatesModule
 * @see FormTemplateOptionsEntity
 */
@Module({
  imports: [ServiceOptionValuePersistenceModule, ServiceOptionGroupsModule],
  controllers: [ServiceOptionValuesController],
  providers: [ServiceOptionValuesService],
  exports: [ServiceOptionValuesService, ServiceOptionValuePersistenceModule],
})
export class ServiceOptionValuesModule {}
