import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { DeletionOtp } from '../../../domain/deletion-otp';

@Entity('account_deletion_otps')
export class DeletionOtpEntity extends EntityHelper implements DeletionOtp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 6 })
  otp: string;

  @Index()
  @Column({ type: 'timestamp' })
  expires_at: Date;

  @Column({ type: 'boolean', default: false })
  verified: boolean;

  @Column({ type: 'varchar', length: 45 })
  ip_address: string;

  @CreateDateColumn()
  created_at: Date;
}
