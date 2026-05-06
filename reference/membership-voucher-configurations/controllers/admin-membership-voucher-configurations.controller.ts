import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';
import { Permissions } from '@/user-permissions/persistence/user-permissions.decorator';
import { MembershipVoucherConfigurationsService } from '@/membership-voucher-configurations/membership-voucher-configurations.service';
import { MembershipVoucherConfiguration } from '@/membership-voucher-configurations/domain/membership-voucher-configuration';
import { FindAllMembershipVoucherConfiguration } from '@/membership-voucher-configurations/domain/find-all-membership-voucher-configuration';
import { CreateMembershipVoucherConfigurationDto } from '@/membership-voucher-configurations/dto/create-membership-voucher-configuration.dto';
import { UpdateMembershipVoucherConfigurationDto } from '@/membership-voucher-configurations/dto/update-membership-voucher-configuration.dto';
import { QueryMembershipVoucherConfigurationDto } from '@/membership-voucher-configurations/dto/query-membership-voucher-configuration.dto';

/**
 * Admin membership voucher configuration endpoints.
 */
@ApiTags('Admin - Membership Voucher Configurations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller({ path: 'admin/membership-voucher-configurations', version: '1' })
export class AdminMembershipVoucherConfigurationsController {
  constructor(
    private readonly service: MembershipVoucherConfigurationsService,
  ) {}

  /**
   * Create configuration.
   */
  @Post()
  @Permissions({ AC10: 'Create' })
  @ApiOperation({ summary: 'Create membership voucher configuration' })
  @ApiBody({ type: CreateMembershipVoucherConfigurationDto })
  @ApiOkResponse({ type: MembershipVoucherConfiguration })
  public create(
    @Body() input: CreateMembershipVoucherConfigurationDto,
    @CurrentUser() currentUser: User,
  ): Promise<MembershipVoucherConfiguration> {
    return this.service.create(input, currentUser);
  }

  /**
   * List configurations.
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
   * Get configuration by id.
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

  /**
   * Update configuration.
   */
  @Patch(':id')
  @Permissions({ AC10: 'Edit' })
  @ApiOperation({ summary: 'Update membership voucher configuration' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateMembershipVoucherConfigurationDto })
  @ApiOkResponse({ type: MembershipVoucherConfiguration })
  public update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateMembershipVoucherConfigurationDto,
    @CurrentUser() currentUser: User,
  ): Promise<MembershipVoucherConfiguration> {
    return this.service.update(id, input, currentUser);
  }

  /**
   * Delete configuration.
   */
  @Delete(':id')
  @Permissions({ AC10: 'Delete' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete membership voucher configuration' })
  @ApiParam({ name: 'id', type: Number })
  public async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    await this.service.remove(id, currentUser);
  }
}
