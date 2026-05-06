import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { BaseMasterEntityHelper } from '@/utils/typeorm/entity/base-master.entity';
import { MenuEntity } from '@/menus/persistence/entities/menu.entity';
import { UserEntity } from '@/users/persistence/entities/user.entity';

@Entity({
  name: 'document_signatory',
})
export class DocumentSignatoryEntity extends BaseMasterEntityHelper {
  @OneToOne(() => MenuEntity, { eager: false })
  @JoinColumn({ name: 'menu_id' })
  menu: MenuEntity;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: false,
  })
  description: string;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'endorsed_by' })
  endorsed_by?: UserEntity;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'reviewed_by' })
  reviewed_by?: UserEntity;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approved_by?: UserEntity;
}
