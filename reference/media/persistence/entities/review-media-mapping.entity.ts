import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { MediaEntity } from './media.entity';
import { ReviewEntity } from '@/reviews/persistence/entities/review.entity';

@Entity({
  name: 'review_media_mappings',
})
export class ReviewMediaMappingEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'int',
  })
  review_id: number;

  @Column({
    type: 'int',
  })
  media_id: number;

  @Column({
    type: 'int',
    default: 0,
  })
  display_order: number;

  @Column({
    type: 'int',
    nullable: true,
  })
  created_by?: number;

  @ManyToOne(() => MediaEntity, (media) => media.review_mappings)
  @JoinColumn({ name: 'media_id' })
  media: MediaEntity;

  @ManyToOne(() => ReviewEntity, (review) => review.review_media_mappings)
  @JoinColumn({ name: 'review_id' })
  review: ReviewEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
