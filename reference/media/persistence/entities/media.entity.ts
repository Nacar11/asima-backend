import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { MediaTypeEnum } from '../../domain/media-type.enum';
import { ProcessingStatusEnum } from '../../domain/processing-status.enum';
import { ProductMediaMappingEntity } from './product-media-mapping.entity';
import { ReviewMediaMappingEntity } from './review-media-mapping.entity';
import { ReturnRequestMediaMappingEntity } from './return-request-media-mapping.entity';
import { StatusEnum } from '@/utils/enums/status-enum';

@Entity({
  name: 'media',
})
export class MediaEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: MediaTypeEnum,
  })
  media_type: MediaTypeEnum;

  @Column({
    type: 'varchar',
    length: 255,
  })
  file_name: string;

  @Column({
    type: 'varchar',
    length: 500,
  })
  file_path: string;

  @Column({
    type: 'bigint',
  })
  file_size: number;

  @Column({
    type: 'varchar',
    length: 100,
  })
  mime_type: string;

  @Column({
    type: 'int',
    nullable: true,
  })
  width?: number;

  @Column({
    type: 'int',
    nullable: true,
  })
  height?: number;

  @Column({
    type: 'int',
    nullable: true,
  })
  duration?: number;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  thumbnail_path?: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  preview_path?: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  compressed_path?: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  watermarked_path?: string;

  @Column({
    type: 'enum',
    enum: ProcessingStatusEnum,
    default: ProcessingStatusEnum.PENDING,
  })
  processing_status: ProcessingStatusEnum;

  @Column({
    type: 'text',
    nullable: true,
  })
  processing_error?: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  title?: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  alt_text?: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description?: string;

  @Column({
    type: 'int',
    nullable: true,
  })
  seller_id?: number;

  @Column({
    type: 'enum',
    enum: StatusEnum,
    default: StatusEnum.ACTIVE,
  })
  status: StatusEnum;

  @Column({ type: 'int', nullable: true })
  created_by?: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Column({ type: 'int', nullable: true })
  updated_by?: number;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @Column({ type: 'int', nullable: true })
  deleted_by?: number;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at?: Date;

  @OneToMany(() => ProductMediaMappingEntity, (mapping) => mapping.media)
  product_mappings: ProductMediaMappingEntity[];

  @OneToMany(() => ReviewMediaMappingEntity, (mapping) => mapping.media)
  review_mappings: ReviewMediaMappingEntity[];

  @OneToMany(() => ReturnRequestMediaMappingEntity, (mapping) => mapping.media)
  return_request_mappings: ReturnRequestMediaMappingEntity[];
}
