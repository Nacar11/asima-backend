import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from '@/utils/entity-helper';
import {
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { SellerEntity } from '@/sellers/persistence/entities/seller.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { AttributeValueEntity } from '@/attribute-values/persistence/entities/attribute-value.entity';

@Entity({ name: 'attributes' })
@Index(['name'])
@Index(['seller_id'])
export class AttributeEntity extends EntityHelper {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 1 })
  @Column({ type: 'int' })
  seller_id: number;

  @ApiProperty({ example: 'Size' })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty({ example: 'Active', enum: ['Active', 'Inactive'] })
  @Column({ type: 'varchar', length: 20, default: 'Active', nullable: false })
  status: string;

  @ManyToOne(() => SellerEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seller_id' })
  seller: SellerEntity;

  @OneToMany(
    () => AttributeValueEntity,
    (attributeValue) => attributeValue.attribute,
    { cascade: true, eager: false },
  )
  attribute_values: AttributeValueEntity[];

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
