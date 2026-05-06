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
import { ProductEntity } from '@/products/persistence/entities/product.entity';

@Entity({
  name: 'product_media_mappings',
})
export class ProductMediaMappingEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'int',
  })
  product_id: number;

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
    type: 'boolean',
    default: false,
  })
  is_primary: boolean;

  @Column({
    type: 'int',
    nullable: true,
  })
  created_by?: number;

  @ManyToOne(() => MediaEntity, (media) => media.product_mappings)
  @JoinColumn({ name: 'media_id' })
  media: MediaEntity;

  @ManyToOne(() => ProductEntity, (product) => product.product_media_mappings)
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
