import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormTemplateEntity } from './entities/form-template.entity';
import { FormTemplateValidationRuleEntity } from './entities/form-template-validation-rule.entity';
import { FormTemplateOptionEntity } from './entities/form-template-option.entity';
import { FormTemplateRepository } from './repositories/form-template.repository';
import { BaseFormTemplateRepository } from './base-form-template.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FormTemplateEntity,
      FormTemplateValidationRuleEntity,
      FormTemplateOptionEntity,
    ]),
  ],
  providers: [
    {
      provide: BaseFormTemplateRepository,
      useClass: FormTemplateRepository,
    },
  ],
  exports: [BaseFormTemplateRepository],
})
export class FormTemplatePersistenceModule {}
