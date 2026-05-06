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
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ShippingProviderEntity } from './shipping-provider.entity';
import { ShippingDistanceTierEntity } from './shipping-distance-tier.entity';

/**
 * ShippingMethod TypeORM entity
 * Represents a shipping method configuration with rate settings
 */
@Entity({
  name: 'shipping_methods',
})
@Index('idx_shipping_methods_provider_id', ['provider_id'])
@Index('idx_shipping_methods_is_active', ['is_active'])
export class ShippingMethodEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'provider_id', type: 'integer', nullable: false })
  provider_id: number;

  @Column({ name: 'name', type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  /** Base fee applied to every shipment */
  @Column({
    name: 'base_fee',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: false,
  })
  base_fee: number;

  /** Rate per kilometer (for distance_weight calculation) */
  @Column({
    name: 'rate_per_km',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  rate_per_km: number | null;

  /** Maximum delivery distance in km (null = unlimited) */
  @Column({
    name: 'max_distance_km',
    type: 'integer',
    nullable: true,
  })
  max_distance_km: number | null;

  /** Rate per kilogram of chargeable weight */
  @Column({
    name: 'rate_per_kg',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  rate_per_kg: number | null;

  /** Divisor for volumetric weight calculation (L×W×H / divisor) */
  @Column({
    name: 'volumetric_divisor',
    type: 'integer',
    default: 5000,
    nullable: false,
  })
  volumetric_divisor: number;

  /** Minimum shipping fee to charge */
  @Column({
    name: 'minimum_fee',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: false,
  })
  minimum_fee: number;

  /** Order subtotal threshold for free shipping (null = no free shipping) */
  @Column({
    name: 'free_shipping_threshold',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  free_shipping_threshold: number | null;

  /** Max weight (kg) to qualify for free shipping (null = no weight limit) */
  @Column({
    name: 'free_shipping_max_weight_kg',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  free_shipping_max_weight_kg: number | null;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
    nullable: false,
  })
  is_active: boolean;

  @Column({
    name: 'display_order',
    type: 'integer',
    default: 0,
    nullable: false,
  })
  display_order: number;

  @ManyToOne(() => ShippingProviderEntity, (provider) => provider.methods, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'provider_id' })
  provider: ShippingProviderEntity;

  @OneToMany(() => ShippingDistanceTierEntity, (tier) => tier.method)
  distance_tiers: ShippingDistanceTierEntity[];

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at: Date | null;
}
