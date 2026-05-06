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
import { ShippingMethodEntity } from './shipping-method.entity';
import { ShippingZoneEntity } from './shipping-zone.entity';

/**
 * ShippingSurgeRule TypeORM entity
 * Time-based surge pricing (Phase 2, table created now, disabled by default)
 */
@Entity({
  name: 'shipping_surge_rules',
})
@Index('idx_shipping_surge_rules_method_id', ['method_id'])
export class ShippingSurgeRuleEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'method_id', type: 'integer', nullable: false })
  method_id: number;

  @Column({ name: 'zone_id', type: 'integer', nullable: true })
  zone_id: number | null;

  @Column({ name: 'name', type: 'varchar', length: 100, nullable: false })
  name: string;

  /** Days of week (1=Mon, 7=Sun), null = all days */
  @Column({
    name: 'day_of_week',
    type: 'integer',
    array: true,
    nullable: true,
  })
  day_of_week: number[] | null;

  @Column({ name: 'start_time', type: 'time', nullable: false })
  start_time: string;

  @Column({ name: 'end_time', type: 'time', nullable: false })
  end_time: string;

  /** Surge multiplier (e.g., 1.20 = 20% increase) */
  @Column({
    name: 'surge_multiplier',
    type: 'decimal',
    precision: 3,
    scale: 2,
    nullable: false,
  })
  surge_multiplier: number;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: false,
    nullable: false,
  })
  is_active: boolean;

  @ManyToOne(() => ShippingMethodEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'method_id' })
  method: ShippingMethodEntity;

  @ManyToOne(() => ShippingZoneEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'zone_id' })
  zone: ShippingZoneEntity | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
