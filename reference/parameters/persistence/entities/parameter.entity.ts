import { Column, Entity } from 'typeorm';
import { BaseMasterEntityHelper } from '@/utils/typeorm/entity/base-master.entity';

@Entity({
  name: 'parameter',
})
export class ParameterEntity extends BaseMasterEntityHelper {
  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  code: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  param_items: string;

  @Column({
    nullable: false,
    type: 'varchar',
    length: 200,
  })
  description: string;

  @Column({
    nullable: true,
    type: 'varchar',
    length: 1000,
  })
  string_value: string;

  @Column({
    nullable: true,
    type: 'decimal',
    precision: 18,
    scale: 4,
  })
  numeric_value: number;

  @Column({
    nullable: true,
    type: 'boolean',
  })
  boolean_value: boolean;

  @Column({
    nullable: true,
    type: 'timestamp',
  })
  date_value: Date;

  @Column({
    nullable: true,
    type: 'varchar',
    length: 255,
  })
  salt: string;
}
