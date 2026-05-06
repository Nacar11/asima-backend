import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ServicePackageStatusEnum } from '@/service-packages/enums/service-package-status.enum';

@Entity({ name: 'service_packages' })
@Index(['service_id'])
@Index(['status'])
export class ServicePackageEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  service_id: number;

  @ManyToOne(() => ServiceEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: ServiceEntity;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  price: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  compare_at_price: number | null;

  @Column({ type: 'int', nullable: true })
  duration_minutes: number | null;

  @Column({ type: 'jsonb', nullable: true })
  inclusions: any | null;

  @Column({ type: 'int', nullable: true })
  max_bookings_per_day: number | null;

  @Column({ type: 'boolean', default: false, nullable: false })
  is_popular: boolean;

  @Column({ type: 'int', default: 0, nullable: false })
  display_order: number;

  @Column({
    type: 'enum',
    enum: ServicePackageStatusEnum,
    default: ServicePackageStatusEnum.ACTIVE,
    nullable: false,
  })
  status: ServicePackageStatusEnum;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  updated_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by?: UserEntity | null;

  @Column({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null;
}
