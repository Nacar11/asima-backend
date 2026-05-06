import { BaseDomain } from '@/utils/domain/base.domain';
import { MasterStatusEnum } from '@/utils/enums/status-enum';
import { ApiProperty } from '@nestjs/swagger';

/**
 * BaseMasterDomain extends BaseDomain by adding a status property.
 *
 * @extends BaseDomain
 * @property {MasterStatusEnum} status - Status of the entity.
 */
export class BaseMasterDomain extends BaseDomain {
  @ApiProperty({
    type: () => String,
    nullable: false,
    example: MasterStatusEnum.ACTIVE,
  })
  status: MasterStatusEnum;
}
