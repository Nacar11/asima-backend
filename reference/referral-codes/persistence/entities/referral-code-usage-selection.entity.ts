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
import { ReferralCodeUsageEntity } from '@/referral-codes/persistence/entities/referral-code-usage.entity';
import { VoucherEntity } from '@/vouchers/persistence/entities/voucher.entity';

@Entity({ name: 'referral_code_usage_selections' })
@Unique('UQ_referral_code_usage_selections', ['referral_code_usage_id', 'voucher_id'])
@Index('IDX_referral_code_usage_selections_usage_id', ['referral_code_usage_id'])
export class ReferralCodeUsageSelectionEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  referral_code_usage_id: number;

  @ManyToOne(() => ReferralCodeUsageEntity, (u) => u.selections, {
    eager: false,
    nullable: false,
  })
  @JoinColumn({ name: 'referral_code_usage_id' })
  usage: ReferralCodeUsageEntity;

  @Column({ type: 'int', nullable: false })
  voucher_id: number;

  @ManyToOne(() => VoucherEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'voucher_id' })
  voucher: VoucherEntity;

  @CreateDateColumn({ name: 'selected_at' })
  selected_at: Date;
}
