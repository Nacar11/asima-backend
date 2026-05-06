import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from '@/utils/entity-helper';
import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { ProductEntity } from '@/products/persistence/entities/product.entity';
import { AttributeEntity } from '@/attributes/persistence/entities/attribute.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Entity({ name: 'product_attributes' })
@Index(['product_id'])
@Index(['attribute_id'])
export class ProductAttributeEntity extends EntityHelper {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 1 })
  @Column({ type: 'int' })
  product_id: number;

  @ApiProperty({ example: 1 })
  @Column({ type: 'int' })
  attribute_id: number;

  @ApiProperty({
    example: [1, 2, 3],
    description: 'Array of attribute value IDs',
  })
  @Column({ type: 'int', array: true, nullable: true })
  attribute_value_ids: number[];

  @ManyToOne(() => ProductEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @ManyToOne(() => AttributeEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attribute_id' })
  attribute: AttributeEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by: UserEntity;

  @DeleteDateColumn()
  deleted_at: Date;
}
