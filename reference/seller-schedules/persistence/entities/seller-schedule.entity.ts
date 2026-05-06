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
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Entity({ name: 'seller_schedules' })
@Index(['seller_id'])
@Index(['day_of_week'])
@Index(['status'])
@Index(['seller_id', 'day_of_week'], { unique: true })
export class SellerScheduleEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  seller_id: number;

  @ManyToOne(() => SellerEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seller_id' })
  seller: SellerEntity;

  @Column({ type: 'int', nullable: false })
  day_of_week: number;

  @Column({ type: 'varchar', length: 20, default: 'Active', nullable: false })
  status: string;

  @Column({ type: 'time', nullable: true })
  start_time?: string | null;

  @Column({ type: 'time', nullable: true })
  end_time?: string | null;

  @Column({ type: 'time', nullable: true })
  break_start?: string | null;

  @Column({ type: 'time', nullable: true })
  break_end?: string | null;

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
