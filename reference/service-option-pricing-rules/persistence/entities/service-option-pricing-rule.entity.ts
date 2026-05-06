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
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ServiceOptionPricingRuleConditionEntity } from './service-option-pricing-rule-condition.entity';

@Entity({ name: 'service_option_pricing_rules' })
@Index(['service_id'])
@Index(['is_active'])
@Index(['deleted_at'])
export class ServiceOptionPricingRuleEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  service_id: number;

  @ManyToOne(() => ServiceEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'service_id' })
  service: ServiceEntity;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 120, nullable: false })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price_adjustment: number;

  @Column({ type: 'int', default: 0, nullable: false })
  duration_adjustment_minutes: number;

  @Column({ type: 'int', default: 0, nullable: false })
  priority: number;

  @Column({ type: 'boolean', default: true, nullable: false })
  is_active: boolean;

  @OneToMany(
    () => ServiceOptionPricingRuleConditionEntity,
    (condition) => condition.rule,
    { cascade: false, eager: false },
  )
  conditions?: ServiceOptionPricingRuleConditionEntity[];

  @ManyToOne(() => UserEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by?: UserEntity | null;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at?: Date | null;
}
