import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { VoucherEntity } from '@/vouchers/persistence/entities/voucher.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { MembershipPlanEntity } from '@/memberships/persistence/entities/membership-plan.entity';

@Entity({ name: 'membership_voucher_configurations' })
@Index(['membership_plan_id'])
@Index(['voucher_id'])
@Index(['is_active'])
export class MembershipVoucherConfigurationEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  membership_plan_id: number;

  @ManyToOne(
    () => MembershipPlanEntity,
    (plan) => plan.membership_voucher_configurations,
    {
      eager: false,
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'membership_plan_id' })
  membership_plan: MembershipPlanEntity;

  @Column({ type: 'int', nullable: false })
  voucher_id: number;

  @ManyToOne(() => VoucherEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'voucher_id' })
  voucher: VoucherEntity;

  @Column({ type: 'int', default: 1, nullable: false })
  quantity: number;

  @Column({ type: 'boolean', default: true, nullable: false })
  is_active: boolean;

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
