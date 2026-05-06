import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { FormTemplateEntity } from './form-template.entity';

@Entity({ name: 'form_template_validation_rules' })
@Index(['form_template_id'])
export class FormTemplateValidationRuleEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  form_template_id: number;

  @ManyToOne(
    () => FormTemplateEntity,
    (template) => template.validation_rules,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'form_template_id' })
  form_template: FormTemplateEntity;

  @Column({ type: 'varchar', length: 50, nullable: false })
  rule_type: string; // 'min', 'max', 'pattern', 'min_length', 'max_length', 'required'

  @Column({ type: 'varchar', length: 255, nullable: false })
  rule_value: string; // The validation value

  @Column({ type: 'varchar', length: 500, nullable: true })
  error_message: string | null; // Custom error message

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
