import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { VoucherEntity } from '@/vouchers/persistence/entities/voucher.entity';
import { UserVoucherStatusEnum } from '@/vouchers/enums/user-voucher-status.enum';

@Entity({ name: 'user_vouchers' })
@Index('IDX_user_vouchers_user_id', ['user_id'])
@Index('IDX_user_vouchers_voucher_id', ['voucher_id'])
@Index('IDX_user_vouchers_status', ['status'])
export class UserVoucherEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;
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
  @Column({ type: 'timestamptz', default: () => 'now()', nullable: false })
  collected_at: Date;
  @Column({
    type: 'enum',
    enum: UserVoucherStatusEnum,
    default: UserVoucherStatusEnum.AVAILABLE,
    nullable: false,
  })
  status: UserVoucherStatusEnum;
  @Column({ type: 'timestamptz', nullable: true })
  used_at: Date | null;
  @Column({ type: 'timestamptz', nullable: true })
  expired_at: Date | null;
  @Index('IDX_user_vouchers_expires_at')
  @Column({ type: 'timestamptz', nullable: true })
  expires_at: Date | null;
  @CreateDateColumn()
  created_at: Date;
  @UpdateDateColumn()
  updated_at: Date;
}
