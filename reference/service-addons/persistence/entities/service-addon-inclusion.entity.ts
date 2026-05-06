import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';
import { ServiceAddonEntity } from './service-addon.entity';

@Entity({ name: 'service_addon_inclusions' })
export class ServiceAddonInclusionEntity extends EntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  addon_id: number;

  @ManyToOne(() => ServiceAddonEntity, (addon) => addon.inclusions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'addon_id' })
  addon: ServiceAddonEntity;

  @Column({ type: 'text', nullable: false })
  description: string;

  @Column({ type: 'int', default: 0, nullable: false })
  display_order: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
