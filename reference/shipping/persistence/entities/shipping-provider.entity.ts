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
import { ShippingMethodEntity } from './shipping-method.entity';
import { ShippingZoneEntity } from './shipping-zone.entity';
import { ProviderType } from '@/shipping/domain/enums/shipping.enum';

/**
 * ShippingProvider TypeORM entity
 * Registry of carriers/strategies
 */
@Entity({
  name: 'shipping_providers',
})
@Index('idx_shipping_providers_code', ['code'], { unique: true })
@Index('idx_shipping_providers_is_active', ['is_active'])
export class ShippingProviderEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({
    name: 'code',
    type: 'varchar',
    length: 50,
    nullable: false,
    unique: true,
  })
  code: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @Column({
    name: 'provider_type',
    type: 'enum',
    enum: ProviderType,
    default: ProviderType.IN_HOUSE,
    nullable: false,
  })
  provider_type: ProviderType;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
    nullable: false,
  })
  is_active: boolean;

  @Column({
    name: 'is_default',
    type: 'boolean',
    default: false,
    nullable: false,
  })
  is_default: boolean;

  @Column({
    name: 'display_order',
    type: 'integer',
    default: 0,
    nullable: false,
  })
  display_order: number;

  @OneToMany(() => ShippingZoneEntity, (zone) => zone.provider)
  zones: ShippingZoneEntity[];

  @OneToMany(() => ShippingMethodEntity, (method) => method.provider)
  methods: ShippingMethodEntity[];

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
