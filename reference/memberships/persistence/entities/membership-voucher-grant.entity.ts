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
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { MembershipEntity } from '@/memberships/persistence/entities/membership.entity';
import { MembershipPaymentEntity } from '@/memberships/persistence/entities/membership-payment.entity';
import { VoucherEntity } from '@/vouchers/persistence/entities/voucher.entity';

/**
 * Membership voucher grant persistence entity.
 */
@Entity({ name: 'membership_voucher_grants' })
@Index(['membership_id'])
@Index(['user_id'])
@Index(['membership_payment_id'])
@Index(['voucher_id'])
export class MembershipVoucherGrantEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ type: 'int' })
  membership_id: number;
  @ManyToOne(() => MembershipEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'membership_id' })
  membership: MembershipEntity;
  @Column({ type: 'int' })
  user_id: number;
  @ManyToOne(() => UserEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
  @Column({ type: 'int', nullable: false })
  membership_payment_id: number;
  @ManyToOne(() => MembershipPaymentEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'membership_payment_id' })
  membership_payment: MembershipPaymentEntity;
  @Column({ type: 'int', nullable: false })
  voucher_id: number;
  @ManyToOne(() => VoucherEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'voucher_id' })
  voucher: VoucherEntity;
  @Column({ type: 'varchar', length: 100 })
  voucher_code: string;
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
