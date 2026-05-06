import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ReferralCodeEntity } from '@/referral-codes/persistence/entities/referral-code.entity';
import { ReferralCodeUsageSelectionEntity } from '@/referral-codes/persistence/entities/referral-code-usage-selection.entity';
import { ReferralCodeUsageSelectionStatusEnum } from '@/referral-codes/enums/referral-code-usage-selection-status.enum';

@Entity({ name: 'referral_code_usages' })
@Unique('UQ_referral_code_usages_rc_user', ['referral_code_id', 'user_id'])
@Index('IDX_referral_code_usages_user_id', ['user_id'])
export class ReferralCodeUsageEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  referral_code_id: number;

  @ManyToOne(() => ReferralCodeEntity, (rc) => rc.usages, {
    eager: false,
    nullable: false,
  })
  @JoinColumn({ name: 'referral_code_id' })
  referralCode: ReferralCodeEntity;

  @Column({ type: 'int', nullable: false })
  user_id: number;

  @ManyToOne(() => UserEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({
    type: 'enum',
    enum: ReferralCodeUsageSelectionStatusEnum,
    default: ReferralCodeUsageSelectionStatusEnum.NOT_APPLICABLE,
    nullable: false,
  })
  selection_status: ReferralCodeUsageSelectionStatusEnum;

  @Column({ type: 'timestamptz', nullable: true })
  selection_deadline: Date | null;

  @OneToMany(
    () => ReferralCodeUsageSelectionEntity,
    (sel) => sel.usage,
    { eager: false },
  )
  selections: ReferralCodeUsageSelectionEntity[];

  @CreateDateColumn()
  created_at: Date;
}
