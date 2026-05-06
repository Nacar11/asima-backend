import { Column, Entity, PrimaryColumn } from 'typeorm';
import { EntityHelper } from '@/utils/entity-helper';

@Entity({
  name: 'role',
})
export class RoleEntity extends EntityHelper {
  @PrimaryColumn()
  id: number;

  @Column()
  name?: string;
}
