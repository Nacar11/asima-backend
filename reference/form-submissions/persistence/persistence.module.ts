import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormSubmissionEntity } from './entities/form-submission.entity';
import { FormSubmissionValueEntity } from './entities/form-submission-value.entity';
import { FormSubmissionRepository } from './repositories/form-submission.repository';
import { BaseFormSubmissionRepository } from './base-form-submission.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([FormSubmissionEntity, FormSubmissionValueEntity]),
  ],
  providers: [
    {
      provide: BaseFormSubmissionRepository,
      useClass: FormSubmissionRepository,
    },
  ],
  exports: [BaseFormSubmissionRepository],
})
export class FormSubmissionPersistenceModule {}
