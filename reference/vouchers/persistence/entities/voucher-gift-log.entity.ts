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
import { VoucherEntity } from '@/vouchers/persistence/entities/voucher.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Entity({ name: 'voucher_gift_logs' })
@Index('IDX_voucher_gift_logs_voucher_id', ['voucher_id'])
@Index('IDX_voucher_gift_logs_gifted_by_user_id', ['gifted_by_user_id'])
@Index('IDX_voucher_gift_logs_gifted_to_user_id', ['gifted_to_user_id'])
@Index('IDX_voucher_gift_logs_created_at', ['created_at'])
export class VoucherGiftLogEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  voucher_id: number | null;

  @ManyToOne(() => VoucherEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'voucher_id' })
  voucher: VoucherEntity | null;

  @Column({ type: 'int', nullable: false })
  gifted_by_user_id: number;

  @ManyToOne(() => UserEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'gifted_by_user_id' })
  gifted_by: UserEntity;

  @Column({ type: 'int', nullable: true })
  gifted_to_user_id: number | null;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'gifted_to_user_id' })
  gifted_to: UserEntity | null;

  @Column({ type: 'int', nullable: false })
  quantity: number;

  // --- Snapshot columns (point-in-time values at gift time) ---

  @Column({ type: 'varchar', length: 30, nullable: false })
  voucher_code: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  voucher_discount_type: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  voucher_discount_value: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  voucher_max_discount_cap: number | null;

  @Column({ type: 'varchar', length: 30, nullable: false })
  voucher_scope: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  voucher_description: string | null;

  @Column({ type: 'int', nullable: true })
  seller_id: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  seller_name: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  gifted_to_first_name: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  gifted_to_last_name: string | null;

  // --- End snapshot columns ---

  @Column({ type: 'int', nullable: true })
  created_by: number;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: UserEntity;

  @CreateDateColumn()
  created_at: Date;
}
