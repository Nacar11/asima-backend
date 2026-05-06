import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { ReferralCodeEntity } from '@/referral-codes/persistence/entities/referral-code.entity';
import { VoucherEntity } from '@/vouchers/persistence/entities/voucher.entity';

@Entity({ name: 'referral_code_vouchers' })
@Unique('UQ_referral_code_vouchers', ['referral_code_id', 'voucher_id'])
@Index('IDX_referral_code_vouchers_rc_id', ['referral_code_id'])
export class ReferralCodeVoucherEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  referral_code_id: number;

  @ManyToOne(() => ReferralCodeEntity, (rc) => rc.vouchers, {
    eager: false,
    nullable: false,
  })
  @JoinColumn({ name: 'referral_code_id' })
  referralCode: ReferralCodeEntity;

  @Column({ type: 'int', nullable: false })
  voucher_id: number;

  @ManyToOne(() => VoucherEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'voucher_id' })
  voucher: VoucherEntity;

  @CreateDateColumn()
  created_at: Date;
}
