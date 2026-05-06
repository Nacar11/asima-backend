import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { FormFieldTypeEnum } from '@/form-templates/enums/form-field-type.enum';
import { FormTemplateValidationRuleEntity } from './form-template-validation-rule.entity';
import { FormTemplateOptionEntity } from './form-template-option.entity';

@Entity({ name: 'form_templates' })
@Index(['service_id'])
@Index(['is_active'])
@Index(['deleted_at'])
@Unique(['service_id', 'code'])
export class FormTemplateEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  service_id: number;

  @ManyToOne(() => ServiceEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: ServiceEntity;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  code: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: FormFieldTypeEnum.TEXT,
    nullable: false,
  })
  field_type: FormFieldTypeEnum;

  @Column({ type: 'boolean', default: false, nullable: false })
  is_required: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  placeholder: string | null;

  @Column({ type: 'text', nullable: true })
  help_text: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  default_value: string | null;

  @Column({ type: 'int', default: 0, nullable: false })
  sequence_order: number;

  @Column({ type: 'boolean', default: true, nullable: false })
  is_active: boolean;

  @OneToMany(
    () => FormTemplateValidationRuleEntity,
    (rule) => rule.form_template,
    { cascade: true, eager: false },
  )
  validation_rules: FormTemplateValidationRuleEntity[];

  @OneToMany(() => FormTemplateOptionEntity, (option) => option.form_template, {
    cascade: true,
    eager: false,
  })
  options: FormTemplateOptionEntity[];

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by?: UserEntity | null;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at?: Date | null;
}
