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
import { SellerMemberEntity } from '@/seller-members/persistence/entities/seller-member.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';
import { ProficiencyLevelEnum } from '@/seller-member-services/enums/proficiency-level.enum';

@Entity({ name: 'seller_member_services' })
@Index(['seller_member_id', 'service_id'], { unique: true })
@Index(['status'])
export class SellerMemberServiceEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  seller_member_id: number;

  @ManyToOne(() => SellerMemberEntity, { nullable: false })
  @JoinColumn({ name: 'seller_member_id' })
  seller_member: SellerMemberEntity;

  @Column({ type: 'int', nullable: false })
  service_id: number;

  @Column({
    type: 'enum',
    enum: ProficiencyLevelEnum,
    default: ProficiencyLevelEnum.STANDARD,
    nullable: false,
  })
  proficiency_level: ProficiencyLevelEnum;

  @Column({ type: 'boolean', default: false, nullable: false })
  is_primary: boolean;

  @Column({ type: 'varchar', length: 20, default: 'Active', nullable: false })
  status: string;

  @ManyToOne(() => UserEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'created_by' })
  created_by: UserEntity | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'updated_by' })
  updated_by: UserEntity | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => UserEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by?: UserEntity | null;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at?: Date | null;
}
