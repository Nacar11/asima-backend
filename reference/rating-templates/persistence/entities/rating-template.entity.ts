import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { RatingTypeEnum } from '@/rating-templates/enums/rating-type.enum';

/**
 * Rating Template TypeORM entity.
 *
 * Admin-defined rating criteria templates for customer reviews.
 *
 * @version 1
 * @since 1.0.0
 */
@Entity({ name: 'rating_templates' })
@Index(['code'], { unique: true })
@Index(['is_active'])
@Index(['deleted_at'])
export class RatingTemplateEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: false, unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: RatingTypeEnum,
    default: RatingTypeEnum.STARS,
    nullable: false,
  })
  rating_type: RatingTypeEnum;

  @Column({ type: 'int', nullable: false, default: 1 })
  min_value: number;

  @Column({ type: 'int', nullable: false, default: 5 })
  max_value: number;

  @Column({ type: 'boolean', default: true, nullable: false })
  is_required: boolean;

  @Column({ type: 'int', default: 0, nullable: false })
  sequence_order: number;

  @Column({ type: 'boolean', default: true, nullable: false })
  is_active: boolean;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'Active',
    nullable: false,
  })
  status: string;

  // ==================== Audit Fields ====================

  @Column({ type: 'int', nullable: true })
  created_by: number | null;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by_user: UserEntity | null;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'int', nullable: true })
  updated_by: number | null;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updated_by_user: UserEntity | null;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'int', nullable: true })
  deleted_by: number | null;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by_user: UserEntity | null;

  @DeleteDateColumn()
  deleted_at: Date | null;
}
