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
import { JwtGuard } from '@/utils/guards/jwt.guard';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { MembershipPlansService } from '@/membership-plans/membership-plans.service';
import { MembershipPlan } from '@/membership-plans/domain/membership-plan';
import { CreateMembershipPlanDto } from '@/membership-plans/dto/create-membership-plan.dto';
import { UpdateMembershipPlanDto } from '@/membership-plans/dto/update-membership-plan.dto';
import { QueryMembershipPlanDto } from '@/membership-plans/dto/query-membership-plan.dto';
import { FindAllMembershipPlan } from '@/membership-plans/domain/find-all-membership-plan';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';
import { Permissions } from '@/user-permissions/persistence/user-permissions.decorator';
import { Public } from '@/utils/decorators/public.decorator';

/**
 * Unified controller for membership plans with role-based access control.
 * Admin users have full CRUD access, customers have read-only access to active plans.
 */
@ApiTags('Membership Plans')
@ApiBearerAuth()
@UseGuards(JwtGuard, PermissionsGuard)
@Controller('v1/membership-plans')
export class MembershipPlansController {
  constructor(
    private readonly membershipPlansService: MembershipPlansService,
  ) {}

  @Post()
  @Permissions({ AC11: 'Create' })
  @ApiOperation({ summary: 'Create a new membership plan (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Membership plan created successfully',
    type: MembershipPlan,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async create(
    @Body() input: CreateMembershipPlanDto,
    @CurrentUser() currentUser: User,
  ): Promise<MembershipPlan> {
    return this.membershipPlansService.create(input, currentUser);
  }

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Get membership plans',
    description:
      'Admins see all plans, customers and guests see only active plans',
  })
  @ApiResponse({
    status: 200,
    description: 'Membership plans retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiQuery({
    name: 'plan_code',
    required: false,
    description: 'Filter by plan code (Admin only)',
  })
  @ApiQuery({
    name: 'plan_name',
    required: false,
    description: 'Filter by plan name (Admin only)',
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
    @Query() query: QueryMembershipPlanDto,
    @CurrentUser() currentUser?: User,
  ): Promise<FindAllMembershipPlan> {
    // Check if user is admin (has all AC11 permissions) or customer/guest (only View)
    const isAdmin =
      currentUser?.system_admin ||
      currentUser?.assignments?.some(
        (assignment) =>
          assignment.group?.group_name === 'Admin' &&
          assignment.status === 'Active',
      );

    if (isAdmin) {
      // Admin can see all plans with all filters
      return this.membershipPlansService.findAll(query);
    } else {
      // Customer can only see active plans with limited filters
      const customerQuery = {
        ...query,
        is_active: true,
        plan_code: undefined,
        plan_name: undefined,
      };
      return this.membershipPlansService.findAll(customerQuery);
    }
  }

  @Get(':id')
  @Permissions({ AC11: 'View' })
  @ApiOperation({ summary: 'Get membership plan by ID' })
  @ApiResponse({
    status: 200,
    description: 'Membership plan retrieved successfully',
    type: MembershipPlan,
  })
  @ApiResponse({ status: 404, description: 'Membership plan not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async findById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<MembershipPlan> {
    const membershipPlan = await this.membershipPlansService.findById(id);

    // Check if user is admin or customer
    const isAdmin =
      currentUser.system_admin ||
      currentUser.assignments?.some(
        (assignment) =>
          assignment.group?.group_name === 'Admin' &&
          assignment.status === 'Active',
      );

    // Customers can only view active plans
    if (!isAdmin && !membershipPlan.is_active) {
      throw new NotFoundException('Membership plan not found');
    }

    return membershipPlan;
  }

  @Put(':id')
  @Permissions({ AC11: 'Edit' })
  @ApiOperation({ summary: 'Update membership plan (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Membership plan updated successfully',
    type: MembershipPlan,
  })
  @ApiResponse({ status: 404, description: 'Membership plan not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateMembershipPlanDto,
    @CurrentUser() currentUser: User,
  ): Promise<MembershipPlan> {
    return this.membershipPlansService.update(id, input, currentUser);
  }

  @Delete(':id')
  @Permissions({ AC11: 'Delete' })
  @ApiOperation({ summary: 'Delete membership plan (Admin only)' })
  @ApiResponse({
    status: 204,
    description: 'Membership plan deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Membership plan not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    return this.membershipPlansService.delete(id, currentUser);
  }
}
