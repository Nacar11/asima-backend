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
import { ShippingZoneAreaEntity } from './shipping-zone-area.entity';

/**
 * ShippingZone TypeORM entity
 * Geographic regions per provider
 */
@Entity({
  name: 'shipping_zones',
})
@Index('idx_shipping_zones_provider_id', ['provider_id'])
@Index('idx_shipping_zones_priority', ['priority'])
export class ShippingZoneEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'provider_id', type: 'integer', nullable: false })
  provider_id: number;

  @Column({ name: 'name', type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @Column({
    name: 'is_default',
    type: 'boolean',
    default: false,
    nullable: false,
  })
  is_default: boolean;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
    nullable: false,
  })
  is_active: boolean;

  @Column({
    name: 'priority',
    type: 'integer',
    default: 0,
    nullable: false,
  })
  priority: number;

  @ManyToOne(() => ShippingProviderEntity, (provider) => provider.zones, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'provider_id' })
  provider: ShippingProviderEntity;

  @OneToMany(() => ShippingZoneAreaEntity, (area) => area.zone)
  areas: ShippingZoneAreaEntity[];

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
