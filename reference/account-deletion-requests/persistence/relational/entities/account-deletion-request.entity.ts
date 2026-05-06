import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { AccountDeletionRequest } from '../../../domain/account-deletion-request';
import { AccountDeletionStatus } from '../../../domain/account-deletion-request';

@Entity('account_deletion_requests')
export class AccountDeletionRequestEntity
  extends EntityHelper
  implements AccountDeletionRequest
{
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  full_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone_number?: string;

  @Column({ type: 'varchar', length: 50 })
  account_type: string;

  @Column({ type: 'varchar', length: 255 })
  reason: string;

  @Column({ type: 'text', nullable: true })
  additional_comments?: string;

  @Column({ type: 'varchar', length: 45 })
  ip_address: string;

  @Column({ type: 'text' })
  user_agent: string;

  @Index()
  @Column({
    type: 'enum',
    enum: AccountDeletionStatus,
    default: AccountDeletionStatus.PENDING,
  })
  status: AccountDeletionStatus;

  @Index()
  @Column({ type: 'varchar', length: 50, unique: true })
  reference_number: string;

  @Column({ type: 'uuid', nullable: true })
  processed_by_id?: string;

  @Column({ type: 'timestamp', nullable: true })
  processed_at?: Date;

  @Column({ type: 'text', nullable: true })
  processing_notes?: string;

  @Index()
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at?: Date;
}
