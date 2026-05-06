import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseMasterEntityHelper } from '@/utils/typeorm/entity/base-master.entity';
import { MenuEntity } from '@/menus/persistence/entities/menu.entity';
import { MasterStatusEnum } from '@/utils/enums/status-enum';

@Entity({
  name: 'document_control',
})
export class DocumentControlEntity extends BaseMasterEntityHelper {
  @OneToOne(() => MenuEntity, { eager: true })
  @JoinColumn({ name: 'menu_id' })
  menu: MenuEntity;

  @Column({
    type: 'varchar',
    length: 12,
    nullable: false,
  })
  prefix_pattern: string;

  @Column({
    type: 'int4',
    nullable: false,
  })
  last_series: number;

  @Column({
    type: 'varchar',
    nullable: false,
    default: MasterStatusEnum.ACTIVE,
  })
  status: MasterStatusEnum;
}
