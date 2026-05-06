import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';

@Entity({ name: 'open_play_skill_levels' })
@Index(['sort_order'])
@Index(['is_active'])
export class OpenPlaySkillLevelEntity extends EntityHelper {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 80, nullable: false })
  label: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Column({ type: 'int', nullable: false, default: 0 })
  sort_order: number;

  @Column({ type: 'boolean', nullable: false, default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
