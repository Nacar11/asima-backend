import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { ShippingZoneEntity } from './shipping-zone.entity';
import { AreaType } from '@/shipping/domain/enums/shipping.enum';

/**
 * ShippingZoneArea TypeORM entity
 * Which locations belong to which zone
 */
@Entity({
  name: 'shipping_zone_areas',
})
@Index('idx_zone_areas_lookup', ['area_type', 'area_value'])
@Index('idx_zone_areas_zone_id', ['zone_id'])
export class ShippingZoneAreaEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'zone_id', type: 'integer', nullable: false })
  zone_id: number;

  @Column({
    name: 'area_type',
    type: 'enum',
    enum: AreaType,
    nullable: false,
  })
  area_type: AreaType;

  @Column({ name: 'area_value', type: 'varchar', length: 100, nullable: false })
  area_value: string;

  @ManyToOne(() => ShippingZoneEntity, (zone) => zone.areas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'zone_id' })
  zone: ShippingZoneEntity;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
