import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { ShippingMethodEntity } from './shipping-method.entity';
import { ShippingZoneEntity } from './shipping-zone.entity';

/**
 * ShippingMethodZoneRate TypeORM entity
 * Zone-specific rate overrides (null = use method default)
 */
@Entity({
  name: 'shipping_method_zone_rates',
})
@Unique('uq_method_zone', ['method_id', 'zone_id'])
export class ShippingMethodZoneRateEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'method_id', type: 'integer', nullable: false })
  method_id: number;

  @Column({ name: 'zone_id', type: 'integer', nullable: false })
  zone_id: number;

  @Column({
    name: 'base_fee',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  base_fee: number | null;

  @Column({
    name: 'rate_per_km',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  rate_per_km: number | null;

  @Column({
    name: 'rate_per_kg',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  rate_per_kg: number | null;

  @Column({
    name: 'max_distance_km',
    type: 'integer',
    nullable: true,
  })
  max_distance_km: number | null;

  @Column({
    name: 'minimum_fee',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  minimum_fee: number | null;

  @Column({
    name: 'free_shipping_threshold',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  free_shipping_threshold: number | null;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
    nullable: false,
  })
  is_active: boolean;

  @ManyToOne(() => ShippingMethodEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'method_id' })
  method: ShippingMethodEntity;

  @ManyToOne(() => ShippingZoneEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'zone_id' })
  zone: ShippingZoneEntity;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
