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
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { ServiceOptionValueEntity } from '@/service-option-values/persistence/entities/service-option-value.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { OptionGroupInputTypeEnum } from '@/service-option-groups/enums/option-group-input-type.enum';
import { OptionGroupStatusEnum } from '@/service-option-groups/enums/option-group-status.enum';

@Entity({ name: 'service_option_groups' })
@Index(['service_id'])
@Index(['status'])
@Index(['deleted_at'])
export class ServiceOptionGroupEntity extends EntityHelper {
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

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    default: OptionGroupInputTypeEnum.SELECT,
    nullable: false,
  })
  input_type: OptionGroupInputTypeEnum;

  // Counter settings (for input_type = 'counter')
  @Column({ type: 'int', default: 0, nullable: true })
  min_value: number | null;

  @Column({ type: 'int', default: 10, nullable: true })
  max_value: number | null;

  @Column({ type: 'int', default: 1, nullable: true })
  default_value: number | null;

  @Column({ type: 'int', default: 0, nullable: false })
  display_order: number;

  @Column({ type: 'boolean', default: true, nullable: false })
  is_required: boolean;

  @Column({
    type: 'varchar',
    length: 20,
    default: OptionGroupStatusEnum.ACTIVE,
    nullable: false,
  })
  status: OptionGroupStatusEnum;

  @OneToMany(() => ServiceOptionValueEntity, (value) => value.option_group)
  option_values?: ServiceOptionValueEntity[];

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
