import { ApiProperty } from '@nestjs/swagger';
import { PickleballMerchantApplicationStatusEnum } from '@/pickleball-merchants/enums/pickleball-merchant-application-status.enum';

export class SubmitPickleballMerchantApplicationResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  application_number: string;

  @ApiProperty({ enum: PickleballMerchantApplicationStatusEnum })
  status: PickleballMerchantApplicationStatusEnum;
}
