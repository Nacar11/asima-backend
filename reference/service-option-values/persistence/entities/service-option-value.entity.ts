import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { ServiceOptionGroupEntity } from '@/service-option-groups/persistence/entities/service-option-group.entity';
import { OptionValueStatusEnum } from '@/service-option-values/enums/option-value-status.enum';

@Entity({ name: 'service_option_values' })
@Index(['option_group_id'])
@Index(['status'])
export class ServiceOptionValueEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  option_group_id: number;

  @ManyToOne(() => ServiceOptionGroupEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'option_group_id' })
  option_group: ServiceOptionGroupEntity;

  @Column({ type: 'varchar', length: 255, nullable: false })
  label: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  value: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // Pricing Impact
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    nullable: false,
  })
  price_adjustment: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 4,
    default: 1.0,
    nullable: false,
  })
  price_multiplier: number;

  // Duration Impact
  @Column({ type: 'int', default: 0, nullable: false })
  duration_adjustment_minutes: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  icon_url: string | null;

  @Column({ type: 'int', default: 0, nullable: false })
  display_order: number;

  @Column({ type: 'boolean', default: false, nullable: false })
  is_default: boolean;

  @Column({
    type: 'varchar',
    length: 20,
    default: OptionValueStatusEnum.ACTIVE,
    nullable: false,
  })
  status: OptionValueStatusEnum;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
