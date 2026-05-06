import { Module, forwardRef } from '@nestjs/common';
import { FormTemplatesService } from '@/form-templates/form-templates.service';
import { FormTemplatesController } from '@/form-templates/form-templates.controller';
import { FormTemplatePersistenceModule } from '@/form-templates/persistence/persistence.module';
import { ServicesModule } from '@/services/services.module';

@Module({
  imports: [FormTemplatePersistenceModule, forwardRef(() => ServicesModule)],
  controllers: [FormTemplatesController],
  providers: [FormTemplatesService],
  exports: [FormTemplatesService, FormTemplatePersistenceModule],
})
export class FormTemplatesModule {}
