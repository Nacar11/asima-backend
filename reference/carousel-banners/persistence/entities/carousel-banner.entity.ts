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
import { MediaEntity } from '@/media/persistence/entities/media.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Entity({ name: 'carousel_banners' })
@Index(['media_id'])
@Index(['is_active'])
@Index(['display_order'])
@Index(['start_at'])
@Index(['end_at'])
export class CarouselBannerEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  media_id: number;

  @ManyToOne(() => MediaEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'media_id' })
  media: MediaEntity;

  @Column({ type: 'varchar', length: 255, nullable: false })
  headline: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subtext: string | null;

  @Column({ type: 'varchar', length: 50, nullable: false })
  cta_text: string;

  @Column({ type: 'varchar', length: 500, nullable: false })
  cta_link: string;

  @Column({ type: 'int', nullable: false, default: 0 })
  display_order: number;

  @Column({ type: 'boolean', nullable: false, default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  start_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  end_at: Date | null;

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

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by?: UserEntity | null;

  @DeleteDateColumn()
  deleted_at?: Date | null;
}
