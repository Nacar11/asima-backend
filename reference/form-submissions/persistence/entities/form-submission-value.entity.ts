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
import { FormSubmissionEntity } from './form-submission.entity';
import { FormTemplateEntity } from '@/form-templates/persistence/entities/form-template.entity';

@Entity({ name: 'form_submission_values' })
@Index(['form_submission_id'])
@Index(['field_code'])
export class FormSubmissionValueEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  form_submission_id: number;

  @ManyToOne(() => FormSubmissionEntity, (submission) => submission.values, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'form_submission_id' })
  form_submission: FormSubmissionEntity;

  @Column({ type: 'int', nullable: false })
  form_template_id: number;

  @ManyToOne(() => FormTemplateEntity, { nullable: false })
  @JoinColumn({ name: 'form_template_id' })
  form_template: FormTemplateEntity;

  @Column({ type: 'varchar', length: 100, nullable: false })
  field_code: string; // Denormalized for querying

  @Column({ type: 'varchar', length: 255, nullable: false })
  field_name: string; // Denormalized for display

  @Column({ type: 'varchar', length: 50, nullable: false })
  field_type: string; // Denormalized for parsing

  @Column({ type: 'text', nullable: true })
  value: string | null; // Stored as string, parsed based on field_type

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
