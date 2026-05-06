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
import { ServiceOptionPricingRuleEntity } from './service-option-pricing-rule.entity';
import { ServiceOptionGroupEntity } from '@/service-option-groups/persistence/entities/service-option-group.entity';
import { ServiceOptionValueEntity } from '@/service-option-values/persistence/entities/service-option-value.entity';

@Entity({ name: 'service_option_pricing_rule_conditions' })
@Index(['rule_id'])
@Index(['option_group_id', 'option_value_id'])
export class ServiceOptionPricingRuleConditionEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  rule_id: number;

  @ManyToOne(() => ServiceOptionPricingRuleEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'rule_id' })
  rule: ServiceOptionPricingRuleEntity;

  @Column({ type: 'int', nullable: false })
  option_group_id: number;

  @ManyToOne(() => ServiceOptionGroupEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'option_group_id' })
  option_group: ServiceOptionGroupEntity;

  @Column({ type: 'int', nullable: false })
  option_value_id: number;

  @ManyToOne(() => ServiceOptionValueEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'option_value_id' })
  option_value: ServiceOptionValueEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
