import { BaseEntityHelper } from '@/utils/typeorm/entity/base.entity';
import { TransactionalStatusEnum } from '@/utils/enums/status-enum';
import { Column } from 'typeorm';

/**
 * Abstract base class extending `BaseEntityHelper` to include additional fields
 * for managing the status of transactional entities.
 *
 * @extends BaseEntityHelper
 */
export abstract class BaseTransactionalEntityHelper extends BaseEntityHelper {
  /**
   * The status of the transactional entity, represented as an enum.
   * Defaults to `NEW` if not provided.
   *
   * @type {TransactionalStatusEnum}
   * @memberof BaseTransactionalEntityHelper
   */
  @Column({
    type: 'enum',
    nullable: false,
    enum: TransactionalStatusEnum,
    default: TransactionalStatusEnum.NEW,
  })
  status: TransactionalStatusEnum;
}
