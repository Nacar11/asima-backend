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
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ReferralCodeStatusEnum } from '@/referral-codes/enums/referral-code-status.enum';
import { ReferralCodeSelectionModeEnum } from '@/referral-codes/enums/referral-code-selection-mode.enum';
import { ReferralCodeVoucherEntity } from '@/referral-codes/persistence/entities/referral-code-voucher.entity';
import { ReferralCodeUsageEntity } from '@/referral-codes/persistence/entities/referral-code-usage.entity';

@Entity({ name: 'referral_codes' })
@Index('IDX_referral_codes_deleted_at', ['deleted_at'])
export class ReferralCodeEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, nullable: false })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: ReferralCodeStatusEnum,
    default: ReferralCodeStatusEnum.ACTIVE,
    nullable: false,
  })
  status: ReferralCodeStatusEnum;

  @Column({ type: 'int', nullable: true })
  usage_limit: number | null;

  @Column({ type: 'int', default: 0, nullable: false })
  usage_count: number;

  @Column({ type: 'timestamptz', nullable: true })
  expires_at: Date | null;

  @Column({
    type: 'enum',
    enum: ReferralCodeSelectionModeEnum,
    default: ReferralCodeSelectionModeEnum.AUTO_ASSIGN,
    nullable: false,
  })
  selection_mode: ReferralCodeSelectionModeEnum;

  @Column({ type: 'int', nullable: true })
  max_voucher_selections: number | null;

  @Column({ type: 'int', nullable: true })
  selection_timeout_hours: number | null;

  @OneToMany(() => ReferralCodeVoucherEntity, (rcv) => rcv.referralCode, {
    eager: false,
  })
  vouchers: ReferralCodeVoucherEntity[];

  @OneToMany(() => ReferralCodeUsageEntity, (rcu) => rcu.referralCode, {
    eager: false,
  })
  usages: ReferralCodeUsageEntity[];

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity | null;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity | null;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by: UserEntity | null;

  @DeleteDateColumn()
  deleted_at: Date | null;
}
