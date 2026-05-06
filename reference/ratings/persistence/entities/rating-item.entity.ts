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
import { RatingEntity } from '@/ratings/persistence/entities/rating.entity';
import { RatingTemplateEntity } from '@/rating-templates/persistence/entities/rating-template.entity';

/**
 * Rating Item TypeORM entity.
 *
 * Individual rating values for specific criteria.
 *
 * @version 1
 * @since 1.0.0
 */
@Entity({ name: 'rating_items' })
@Index(['rating_id'])
@Index(['rating_template_id'])
@Index(['deleted_at'])
export class RatingItemEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  rating_id: number;

  @ManyToOne(() => RatingEntity, (rating) => rating.items, {
    eager: false,
    nullable: false,
  })
  @JoinColumn({ name: 'rating_id' })
  rating: RatingEntity;

  @Column({ type: 'int', nullable: false })
  rating_template_id: number;

  @ManyToOne(() => RatingTemplateEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'rating_template_id' })
  rating_template: RatingTemplateEntity;

  @Column({ type: 'varchar', length: 100, nullable: false })
  template_code: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  template_name: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: false })
  value: number;

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
