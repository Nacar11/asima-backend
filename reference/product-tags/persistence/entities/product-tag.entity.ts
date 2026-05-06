import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { TagEntity } from '@/tags/persistence/entities/tag.entity';
import { ProductEntity } from '@/products/persistence/entities/product.entity';

@Entity({
  name: 'product_tags',
})
@Unique(['product_id', 'tag_id'])
export class ProductTagEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({
    type: 'bigint',
    nullable: false,
  })
  @Index()
  product_id: number;

  @Column({
    type: 'bigint',
    nullable: false,
  })
  @Index()
  tag_id: number;

  @Column({
    type: 'int',
    default: 0,
  })
  tag_order: number;

  @CreateDateColumn({
    type: 'timestamptz',
  })
  @Index()
  created_at: Date;

  @Column({
    type: 'bigint',
    nullable: true,
  })
  created_by?: number | null;

  // Relations
  @ManyToOne(() => ProductEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product?: ProductEntity;

  @ManyToOne(() => TagEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag?: TagEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator?: UserEntity | null;
}
