import { BaseDomain } from '@/utils/domain/base.domain';
import { TransactionalStatusEnum } from '@/utils/enums/status-enum';
import { ApiProperty } from '@nestjs/swagger';

/**
 * BaseTransactionalDomain extends BaseDomain by adding a transactional status property.
 *
 * @extends BaseDomain
 * @property {TransactionalStatusEnum} status - Status of the transactional entity.
 */
export class BaseTransactionalDomain extends BaseDomain {
  @ApiProperty({
    type: () => String,
    nullable: false,
    example: TransactionalStatusEnum.NEW,
  })
  status: TransactionalStatusEnum;
}
