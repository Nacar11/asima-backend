import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@/utils/decorators/public.decorator';
import { CreatePickleballMerchantApplicationDto } from '@/pickleball-merchants/dto/create-pickleball-merchant-application.dto';
import { SubmitPickleballMerchantApplicationResponseDto } from '@/pickleball-merchants/dto/submit-pickleball-merchant-application-response.dto';
import { PickleballMerchantApplicationsService } from '@/pickleball-merchants/pickleball-merchant-applications.service';

@ApiTags('Public - Pickleball Merchant Applications')
@Controller({ path: 'pickleball-merchant-applications', version: '1' })
export class PublicPickleballMerchantApplicationsController {
  constructor(
    private readonly pickleballMerchantApplicationsService: PickleballMerchantApplicationsService,
  ) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit an independent pickleball court merchant application',
  })
  @ApiCreatedResponse({ type: SubmitPickleballMerchantApplicationResponseDto })
  async create(
    @Body() dto: CreatePickleballMerchantApplicationDto,
  ): Promise<SubmitPickleballMerchantApplicationResponseDto> {
    return this.pickleballMerchantApplicationsService.submitApplication(dto);
  }
}
