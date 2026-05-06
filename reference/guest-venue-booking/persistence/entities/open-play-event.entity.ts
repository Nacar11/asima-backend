import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { ServiceEntity } from '@/services/persistence/entities/service.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Entity({ name: 'open_play_events' })
@Index(['seller_id'])
@Index(['service_id'])
@Index(['event_date'])
@Index(['status'])
@Index(['skill_level_code'])
export class OpenPlayEventEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  seller_id: number;

  @ManyToOne(() => SellerEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seller_id' })
  seller: SellerEntity;

  @Column({ type: 'int', nullable: false })
  service_id: number;

  @ManyToOne(() => ServiceEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: ServiceEntity;

  @Column({ type: 'date', nullable: false })
  event_date: string;

  @Column({ type: 'time', nullable: false })
  start_time: string;

  @Column({ type: 'time', nullable: false })
  end_time: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    default: 'Open Play',
  })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
    default: 0,
  })
  rate_per_person: number;

  @Column({ type: 'int', nullable: false, default: 1 })
  max_applicants: number;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    default: 'all_levels',
  })
  skill_level_code: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    default: 'Published',
  })
  status: string;

  @Column({ type: 'timestamptz', nullable: true })
  registration_start_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  registration_end_at: Date | null;

  @Column({ type: 'int', nullable: true })
  store_unavailability_id: number | null;

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
