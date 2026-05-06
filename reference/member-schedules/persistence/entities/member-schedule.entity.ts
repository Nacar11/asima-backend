import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { SellerMemberEntity } from '@/seller-members/persistence/entities/seller-member.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Entity({ name: 'member_schedules' })
@Index(['seller_member_id'])
@Index(['day_of_week'])
@Index(['status'])
@Index(['seller_member_id', 'day_of_week'], { unique: true })
export class MemberScheduleEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  seller_member_id: number;

  @ManyToOne(() => SellerMemberEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'seller_member_id' })
  seller_member: SellerMemberEntity;

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
