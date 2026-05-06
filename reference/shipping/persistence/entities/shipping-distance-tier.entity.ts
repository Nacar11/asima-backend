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
 * ShippingDistanceTier TypeORM entity
 * Distance-based pricing tiers (can be zone-specific)
 */
@Entity({
  name: 'shipping_distance_tiers',
})
@Index('idx_shipping_distance_tiers_method_id', ['method_id'])
@Index('idx_shipping_distance_tiers_zone_id', ['zone_id'])
export class ShippingDistanceTierEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'method_id', type: 'integer', nullable: false })
  method_id: number;

  @Column({ name: 'zone_id', type: 'integer', nullable: true })
  zone_id: number | null;

  /** Minimum distance in km (inclusive) */
  @Column({
    name: 'min_distance_km',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
  })
  min_distance_km: number;

  /** Maximum distance in km (exclusive), null = unlimited */
  @Column({
    name: 'max_distance_km',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  max_distance_km: number | null;

  /** Fee for this distance tier */
  @Column({
    name: 'fee',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
  })
  fee: number;

  @Column({
    name: 'display_order',
    type: 'integer',
    default: 0,
    nullable: false,
  })
  display_order: number;

  @ManyToOne(() => ShippingMethodEntity, (method) => method.distance_tiers, {
    onDelete: 'CASCADE',
  })
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
