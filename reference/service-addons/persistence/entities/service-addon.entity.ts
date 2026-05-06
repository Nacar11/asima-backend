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
import { AddonStatusEnum } from '@/service-addons/enums/addon-status.enum';
import { ServiceAddonInclusionEntity } from './service-addon-inclusion.entity';

@Entity({ name: 'service_addons' })
@Index(['service_id'])
@Index(['status'])
@Index(['deleted_at'])
export class ServiceAddonEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  service_id: number;

  @ManyToOne(() => ServiceEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: ServiceEntity;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  short_description: string | null;

  // Simple string field for unit type (e.g., 'per order', 'per room', 'per balcony')
  // Nullable - some add-ons might not need a unit type (fixed price)
  @Column({ type: 'varchar', length: 100, nullable: true })
  unit_type: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  price: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  compare_at_price: number | null;

  @Column({ type: 'int', nullable: true })
  duration_minutes: number | null;

  @Column({ type: 'int', default: 0, nullable: false })
  min_quantity: number;

  @Column({ type: 'int', default: 10, nullable: false })
  max_quantity: number;

  @Column({ type: 'int', default: 0, nullable: false })
  display_order: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  icon_url: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image_url: string | null;

  @Column({ type: 'boolean', default: false, nullable: false })
  is_popular: boolean;

  @Column({ type: 'boolean', default: false, nullable: false })
  is_required: boolean;

  @Column({
    type: 'varchar',
    length: 20,
    default: AddonStatusEnum.ACTIVE,
    nullable: false,
  })
  status: AddonStatusEnum;

  @OneToMany(
    () => ServiceAddonInclusionEntity,
    (inclusion) => inclusion.addon,
    {
      cascade: true,
      eager: false,
    },
  )
  inclusions: ServiceAddonInclusionEntity[];

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by?: UserEntity | null;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at?: Date | null;
}
