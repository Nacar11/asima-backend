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
  name: 'user_details',
})
export class UserDetailEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_user_details_user', { unique: true })
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

  @Index('idx_user_details_username', { unique: true })
  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  username: string | null;

  @Column({
    type: 'enum',
    enum: ['Male', 'Female', 'Other', 'PreferNotToSay'],
    nullable: true,
  })
  gender: string | null;

  @Column({ type: 'date', nullable: true })
  date_of_birth: Date | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  profile_picture: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  profile_picture_path: string | null;

  @Index('idx_user_details_phone')
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'timestamp', nullable: true })
  phone_verified_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  email_verified_at: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: false, default: 'UTC' })
  timezone: string;

  @Column({ type: 'varchar', length: 10, nullable: false, default: 'en_US' })
  locale: string;

  @Column({ type: 'jsonb', nullable: true })
  notification_preferences: Record<string, any> | null;

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
