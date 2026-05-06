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
import { UserVoucherEntity } from '@/vouchers/persistence/entities/user-voucher.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { VoucherEntity } from '@/vouchers/persistence/entities/voucher.entity';

@Entity({ name: 'voucher_qr_tokens' })
@Index('idx_qr_tokens_user_voucher_id', ['user_voucher_id'])
@Index('idx_qr_tokens_expires_at', ['expires_at'])
@Index('idx_qr_tokens_short_code', ['short_code'])
export class VoucherQrTokenEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  user_voucher_id: number;

  @ManyToOne(() => UserVoucherEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'user_voucher_id' })
  user_voucher: UserVoucherEntity;

  @Column({ type: 'int', nullable: false })
  user_id: number;

  @ManyToOne(() => UserEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'int', nullable: false })
  voucher_id: number;

  @ManyToOne(() => VoucherEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'voucher_id' })
  voucher: VoucherEntity;

  @Column({ type: 'varchar', length: 64, nullable: false, unique: true })
  token_hash: string;

  @Column({ type: 'varchar', length: 12, nullable: false, unique: true })
  short_code: string;

  @Column({ type: 'timestamp', nullable: false })
  expires_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  used_at: Date | null;

  @CreateDateColumn()
  created_at: Date;
}
