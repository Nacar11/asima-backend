import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Entity({
  name: 'user_security',
})
export class UserSecurityEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_user_security_user')
  @Column({ type: 'integer', nullable: false, unique: true })
  user_id: number;

  @OneToOne(() => UserEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
  })
  user: UserEntity;

  @Column({ type: 'timestamp', nullable: true })
  password_changed_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  password_expires_at: Date | null;

  @Column({ type: 'boolean', nullable: false, default: false })
  require_password_change: boolean;

  @Column({ type: 'smallint', nullable: false, default: 0 })
  failed_login_attempts: number;

  @Index('idx_user_security_locked')
  @Column({ type: 'timestamp', nullable: true })
  locked_until: Date | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  last_login_ip: string | null;

  @Index('idx_user_security_mfa')
  @Column({ type: 'boolean', nullable: false, default: false })
  mfa_enabled: boolean;

  @Column({
    type: 'enum',
    enum: ['TOTP', 'SMS', 'Email', 'None'],
    nullable: false,
    default: 'None',
  })
  mfa_type: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mfa_secret: string | null;

  @Column({ type: 'text', nullable: true })
  mfa_backup_codes: string | null;

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
}
