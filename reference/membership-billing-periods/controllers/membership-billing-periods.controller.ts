import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { MembershipBillingPeriodsService } from '../membership-billing-periods.service';
import { MembershipBillingPeriod } from '../domain/membership-billing-period';
import { CreateMembershipBillingPeriodDto } from '../dto/create-membership-billing-period.dto';
import { UpdateMembershipBillingPeriodDto } from '../dto/update-membership-billing-period.dto';
import { QueryMembershipBillingPeriodDto } from '../dto/query-membership-billing-period.dto';
import { FindAllMembershipBillingPeriod } from '../domain/find-all-membership-billing-period';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';
import { Permissions } from '@/user-permissions/persistence/user-permissions.decorator';

/**
 * Controller for membership billing periods with role-based access control.
 * Admin users have full CRUD access, customers have read-only access to active billing periods.
 */
@ApiTags('Membership Billing Periods')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('v1/membership-billing-periods')
export class MembershipBillingPeriodsController {
  constructor(
    private readonly membershipBillingPeriodsService: MembershipBillingPeriodsService,
  ) {}

  @Post()
  @Permissions({ AC11: 'Create' })
  @ApiOperation({
    summary: 'Create a new membership billing period (Admin only)',
  })
  @ApiResponse({
    status: 201,
    description: 'Membership billing period created successfully',
    type: MembershipBillingPeriod,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async create(
    @Body() input: CreateMembershipBillingPeriodDto,
    @CurrentUser() currentUser: User,
  ): Promise<MembershipBillingPeriod> {
    return this.membershipBillingPeriodsService.create(input, currentUser);
  }

  @Get()
  @ApiOperation({
    summary: 'Get membership billing periods',
    description:
      'Admins see all billing periods, customers see only active billing periods',
  })
  @ApiResponse({
    status: 200,
    description: 'Membership billing periods retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiQuery({
    name: 'period_code',
    required: false,
    description: 'Filter by period code (Admin only)',
  })
  @ApiQuery({
    name: 'period_name',
    required: false,
    description: 'Filter by period name (Admin only)',
  })
  @ApiQuery({
    name: 'is_active',
    required: false,
    description: 'Filter by active status (Admin only)',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    description: 'Number of records to skip',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    description: 'Number of records to take',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Sort order (ASC or DESC)',
  })
  async findAll(
    @Query() query: QueryMembershipBillingPeriodDto,
    @CurrentUser() currentUser: User,
  ): Promise<FindAllMembershipBillingPeriod> {
    // Check if user is admin or customer
    const isAdmin =
      currentUser.system_admin ||
      currentUser.assignments?.some(
        (assignment) =>
          assignment.group?.group_name === 'Admin' &&
          assignment.status === 'Active',
      );

    if (isAdmin) {
      // Admin can see all billing periods with all filters
      return this.membershipBillingPeriodsService.findAll(query);
    } else {
      // Customer can only see active billing periods with limited filters
      const customerQuery = {
        ...query,
        is_active: true,
        period_code: undefined,
        period_name: undefined,
      };
      return this.membershipBillingPeriodsService.findAll(customerQuery);
    }
  }

  @Get(':id')
  @Permissions({ AC11: 'View' })
  @ApiOperation({ summary: 'Get membership billing period by ID' })
  @ApiResponse({
    status: 200,
    description: 'Membership billing period retrieved successfully',
    type: MembershipBillingPeriod,
  })
  @ApiResponse({
    status: 404,
    description: 'Membership billing period not found',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async findById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<MembershipBillingPeriod> {
    const billingPeriod =
      await this.membershipBillingPeriodsService.findById(id);

    // Check if user is admin or customer
    const isAdmin =
      currentUser.system_admin ||
      currentUser.assignments?.some(
        (assignment) =>
          assignment.group?.group_name === 'Admin' &&
          assignment.status === 'Active',
      );

    // Customers can only view active billing periods
    if (!isAdmin && !billingPeriod.is_active) {
      throw new NotFoundException('Membership billing period not found');
    }

    return billingPeriod;
  }

  @Put(':id')
  @Permissions({ AC11: 'Edit' })
  @ApiOperation({
    summary: 'Update membership billing period (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Membership billing period updated successfully',
    type: MembershipBillingPeriod,
  })
  @ApiResponse({
    status: 404,
    description: 'Membership billing period not found',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateMembershipBillingPeriodDto,
    @CurrentUser() currentUser: User,
  ): Promise<MembershipBillingPeriod> {
    return this.membershipBillingPeriodsService.update(id, input, currentUser);
  }

  @Delete(':id')
  @Permissions({ AC11: 'Delete' })
  @ApiOperation({
    summary: 'Delete membership billing period (Admin only)',
  })
  @ApiResponse({
    status: 204,
    description: 'Membership billing period deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Membership billing period not found',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    return this.membershipBillingPeriodsService.delete(id, currentUser);
  }
}
