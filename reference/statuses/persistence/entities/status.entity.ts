import { Column, Entity, PrimaryColumn } from 'typeorm';

import { EntityHelper } from '@/utils/entity-helper';

@Entity({
  name: 'status',
})
export class StatusEntity extends EntityHelper {
  @PrimaryColumn()
  id: number;

  @Column()
  name?: string;
}
