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

@Entity({ name: 'form_template_options' })
@Index(['form_template_id'])
export class FormTemplateOptionEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  form_template_id: number;

  @ManyToOne(() => FormTemplateEntity, (template) => template.options, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'form_template_id' })
  form_template: FormTemplateEntity;

  @Column({ type: 'varchar', length: 255, nullable: false })
  label: string; // Display label

  @Column({ type: 'varchar', length: 255, nullable: false })
  value: string; // Stored value

  @Column({ type: 'int', default: 0, nullable: false })
  sequence_order: number;

  @Column({ type: 'boolean', default: false, nullable: false })
  is_default: boolean;

  @Column({ type: 'boolean', default: true, nullable: false })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
