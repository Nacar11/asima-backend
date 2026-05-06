import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseMasterEntityHelper } from '@/utils/typeorm/entity/base-master.entity';

@Entity({
  name: 'company',
})
export class CompanyEntity extends BaseMasterEntityHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 100,
  })
  company_name: string;

  @Column({
    type: 'varchar',
    length: 10,
  })
  short_name: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  company_description?: string;

  @Column({
    type: 'varchar',
    length: 15,
    nullable: true,
  })
  tin?: string;

  @Column({
    type: 'timestamptz',
  })
  date_of_establishment: Date;

  @Column({
    type: 'boolean',
    default: false,
  })
  is_main: boolean;

  @Column({
    type: 'varchar',
    length: 255,
  })
  address1: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  address2?: string;

  @Column({
    type: 'varchar',
    length: 20,
  })
  telephone: string;

  @Column({
    type: 'varchar',
    length: 100,
  })
  email: string;

  @Column({
    type: 'timestamptz',
  })
  fiscal_year_start: Date;

  @Column({
    type: 'timestamptz',
  })
  fiscal_year_end: Date;

  @Column({
    type: 'timestamptz',
  })
  month_start: Date;

  @Column({
    type: 'timestamptz',
  })
  month_end: Date;

  @Column({
    type: 'timestamptz',
  })
  prev_month_start: Date;

  @Column({
    type: 'timestamptz',
  })
  prev_month_end: Date;

  @Column({
    type: 'timestamptz',
  })
  next_month_start: Date;

  @Column({
    type: 'timestamptz',
  })
  next_month_end: Date;

  @Column({
    type: 'boolean',
  })
  cycle_opening_backup: boolean;

  @Column({
    type: 'boolean',
  })
  cycle_opening: boolean;

  @Column({
    type: 'boolean',
  })
  cycle_closing: boolean;

  @Column({
    type: 'boolean',
  })
  cycle_closing_backup: boolean;

  @Column({
    type: 'boolean',
  })
  inventory_opening: boolean;

  @Column({
    type: 'boolean',
  })
  inventory_closing: boolean;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  logo?: string;
}
