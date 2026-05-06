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
import { AttributeEntity } from '@/attributes/persistence/entities/attribute.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Entity({ name: 'attribute_values' })
@Index(['attribute_id'])
@Index(['display_order'])
export class AttributeValueEntity extends EntityHelper {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 1 })
  @Column({ type: 'int' })
  attribute_id: number;

  @ApiProperty({ example: 'Red' })
  @Column({ type: 'varchar', length: 255 })
  value: string;

  @ApiProperty({ example: 0 })
  @Column({ type: 'int', default: 0 })
  display_order: number;

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
