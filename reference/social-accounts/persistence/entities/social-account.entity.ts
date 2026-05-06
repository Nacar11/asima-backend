import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Entity({
  name: 'social_account',
})
@Index(['provider', 'provider_id'], { unique: true })
export class SocialAccountEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
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

  @Index()
  @Column({ type: 'varchar', length: 50, nullable: false })
  provider: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  provider_id: string;

  @Column({ type: 'text', nullable: true })
  access_token?: string | null;

  @Column({ type: 'text', nullable: true })
  refresh_token?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  token_expires_at?: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  profile_data?: Record<string, any> | null;

  @Column({ type: 'boolean', nullable: false, default: true })
  is_verified: boolean;

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
