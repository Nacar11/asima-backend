import {
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
  Column,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { EntityHelper } from '@/utils/entity-helper';

@Entity({
  name: 'session',
})
export class SessionEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, {
    eager: true,
  })
  @Index()
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column()
  hash: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;
}
