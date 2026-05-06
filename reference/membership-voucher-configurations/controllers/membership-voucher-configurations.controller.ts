import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';
import { Permissions } from '@/user-permissions/persistence/user-permissions.decorator';
import { MembershipVoucherConfigurationsService } from '@/membership-voucher-configurations/membership-voucher-configurations.service';
import { MembershipVoucherConfiguration } from '@/membership-voucher-configurations/domain/membership-voucher-configuration';
import { FindAllMembershipVoucherConfiguration } from '@/membership-voucher-configurations/domain/find-all-membership-voucher-configuration';
import { QueryMembershipVoucherConfigurationDto } from '@/membership-voucher-configurations/dto/query-membership-voucher-configuration.dto';

/**
 * Customer membership voucher configuration endpoints.
 */
@ApiTags('Membership Voucher Configurations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller({ path: 'membership-voucher-configurations', version: '1' })
export class MembershipVoucherConfigurationsController {
  constructor(
    private readonly service: MembershipVoucherConfigurationsService,
  ) {}

  /**
   * List configurations for customers.
   */
  @Get()
  @Permissions({ AC10: 'View' })
  @ApiOperation({ summary: 'List membership voucher configurations' })
  @ApiOkResponse({ type: Object })
  public findAll(
    @Query() query: QueryMembershipVoucherConfigurationDto,
  ): Promise<FindAllMembershipVoucherConfiguration> {
    return this.service.findAll(query);
  }

  /**
   * Get configuration by id for customers.
   */
  @Get(':id')
  @Permissions({ AC10: 'View' })
  @ApiOperation({ summary: 'Get membership voucher configuration by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: MembershipVoucherConfiguration })
  public findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MembershipVoucherConfiguration> {
    return this.service.findById(id);
  }
}
