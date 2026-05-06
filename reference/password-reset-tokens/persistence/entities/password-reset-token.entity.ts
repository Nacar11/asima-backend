import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Entity({
  name: 'password_reset_tokens',
})
@Index('idx_password_reset_valid', ['user_id', 'expires_at', 'used_at'])
export class PasswordResetTokenEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_password_reset_user')
  @Column({ type: 'integer', nullable: false })
  user_id: number;

  @ManyToOne(() => UserEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
  })
  user: UserEntity;

  @Index('idx_password_reset_token')
  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  token: string;

  @Index('idx_password_reset_otp')
  @Column({ type: 'varchar', length: 6, nullable: true })
  otp: string | null;

  @Index('idx_password_reset_expires')
  @Column({ type: 'timestamp', nullable: false })
  expires_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  used_at: Date | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  user_agent: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  created_at: Date;
}
