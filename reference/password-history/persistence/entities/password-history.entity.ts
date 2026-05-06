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
  name: 'password_history',
})
@Index('idx_password_history_user_date', ['user_id', 'created_at'])
export class PasswordHistoryEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_password_history_user')
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

  @Column({ type: 'varchar', length: 255, nullable: false })
  password_hash: string;

  @CreateDateColumn()
  created_at: Date;
}
