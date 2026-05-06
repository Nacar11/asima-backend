import { Module } from '@nestjs/common';
import { FormSubmissionsService } from '@/form-submissions/form-submissions.service';
import { FormSubmissionsController } from '@/form-submissions/form-submissions.controller';
import { FormSubmissionPersistenceModule } from '@/form-submissions/persistence/persistence.module';
import { ServicesModule } from '@/services/services.module';
import { FormTemplatesModule } from '@/form-templates/form-templates.module';

@Module({
  imports: [
    FormSubmissionPersistenceModule,
    ServicesModule,
    FormTemplatesModule,
  ],
  controllers: [FormSubmissionsController],
  providers: [FormSubmissionsService],
  exports: [FormSubmissionsService, FormSubmissionPersistenceModule],
})
export class FormSubmissionsModule {}
