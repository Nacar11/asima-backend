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
import { ReturnRequestEntity } from '@/return-requests/persistence/entities/return-request.entity';

@Entity({
  name: 'return_request_media_mappings',
})
export class ReturnRequestMediaMappingEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'int',
  })
  return_request_id: number;

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

  @ManyToOne(() => MediaEntity, (media) => media.return_request_mappings)
  @JoinColumn({ name: 'media_id' })
  media: MediaEntity;

  @ManyToOne(
    () => ReturnRequestEntity,
    (returnRequest) => returnRequest.media_mappings,
  )
  @JoinColumn({ name: 'return_request_id' })
  return_request: ReturnRequestEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
