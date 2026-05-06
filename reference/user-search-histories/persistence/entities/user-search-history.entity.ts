import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';

@Entity({ name: 'user_search_histories' })
@Index('idx_user_search_histories_user_id_created_at', [
  'user_id',
  'created_at',
])
export class UserSearchHistoryEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', nullable: false })
  user_id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  keyword: string;

  @Column({ type: 'integer', nullable: true })
  created_by?: number | null;

  @Column({ type: 'integer', nullable: true })
  updated_by?: number | null;

  @Column({ type: 'integer', nullable: true })
  deleted_by?: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at: Date | null;
}
