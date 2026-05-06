import { BaseEntityHelper } from '@/utils/typeorm/entity/base.entity';
import { MasterStatusEnum } from '@/utils/enums/status-enum';
import { Column } from 'typeorm';

/**
 * Abstract base class extending `BaseEntityHelper` to include additional fields
 * for managing the status of master entities.
 *
 * @extends BaseEntityHelper
 */
export abstract class BaseMasterEntityHelper extends BaseEntityHelper {
  /**
   * The status of the master entity, represented as an enum.
   * Defaults to `ACTIVE` if not provided.
   *
   * @type {MasterStatusEnum}
   * @memberof BaseMasterEntityHelper
   */
  @Column({
    type: 'enum',
    nullable: false,
    enum: MasterStatusEnum,
    default: MasterStatusEnum.ACTIVE,
  })
  status: MasterStatusEnum;
}
