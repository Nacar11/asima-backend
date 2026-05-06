import { TransactionStatusEnum } from '@/utils/enums/accounting.enum';
import { BaseEntityHelper } from '@/utils/typeorm/entity/base.entity';
import { Column } from 'typeorm';

/**
 * Abstract base class extending `BaseEntityHelper` to include additional fields
 * for managing the status of transactional entities.
 *
 * @extends BaseEntityHelper
 */
export abstract class BaseTransactionEntityHelper extends BaseEntityHelper {
  /**
   * The status of the transactional entity, represented as an enum.
   * Defaults to `NEW` if not provided.
   *
   * @type {TransactionStatusEnum}
   * @memberof BaseTransactionalEntityHelper
   */
  @Column({
    type: 'enum',
    enum: TransactionStatusEnum,
    default: TransactionStatusEnum.NEW,
    nullable: false,
  })
  status: TransactionStatusEnum;
}
