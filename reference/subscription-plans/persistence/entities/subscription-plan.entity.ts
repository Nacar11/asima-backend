import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { CurrencyEntity } from '@/currencies/persistence/entities/currency.entity';
import { PlanTypeEnum } from '@/subscription-plans/enums/plan-type.enum';
import { BillingCycleEnum } from '@/subscription-plans/enums/billing-cycle.enum';
import { PlanStatusEnum } from '@/subscription-plans/enums/plan-status.enum';

@Entity({ name: 'subscription_plans' })
export class SubscriptionPlanEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'plan_name', length: 100 })
  plan_name: string;

  @Column({ name: 'plan_code', length: 50, unique: true })
  plan_code: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    name: 'plan_type',
    type: 'enum',
    enum: PlanTypeEnum,
    default: PlanTypeEnum.UNIFIED,
  })
  plan_type: PlanTypeEnum;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @ManyToOne(() => CurrencyEntity, { nullable: true })
  @JoinColumn({ name: 'currency_id' })
  currency: CurrencyEntity | null;

  @Column({ name: 'currency_id', type: 'int', nullable: true })
  currency_id: number | null;

  @Column({
    name: 'billing_cycle',
    type: 'enum',
    enum: BillingCycleEnum,
    default: BillingCycleEnum.MONTHLY,
  })
  billing_cycle: BillingCycleEnum;

  @Column({ type: 'jsonb', default: [] })
  features: string[];

  @Column({ name: 'max_sellers', type: 'int', default: 1 })
  max_sellers: number;

  @Column({ name: 'max_products', type: 'int', nullable: true })
  max_products: number | null;

  @Column({ name: 'max_services', type: 'int', nullable: true })
  max_services: number | null;

  @Column({ name: 'max_members', type: 'int', nullable: true })
  max_members: number | null;

  @Column({
    name: 'commission_percent',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 10.0,
  })
  commission_percent: number;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  display_order: number;

  @Column({
    type: 'enum',
    enum: PlanStatusEnum,
    default: PlanStatusEnum.ACTIVE,
  })
  status: PlanStatusEnum;

  @ManyToOne(() => UserEntity, { eager: true, nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => UserEntity, { eager: true, nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => UserEntity, { eager: true, nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by: UserEntity | null;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at: Date | null;
}
