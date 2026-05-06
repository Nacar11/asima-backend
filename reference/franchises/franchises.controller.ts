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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FranchisesService } from '@/franchises/franchises.service';
import { Franchise } from '@/franchises/domain/franchise';
import { FranchiseStatusEvent } from '@/franchises/domain/franchise-status-event';
import { FindAllFranchise } from '@/franchises/domain/find-all-franchise';
import { CreateFranchiseDto } from '@/franchises/dto/create-franchise.dto';
import { UpdateFranchiseDto } from '@/franchises/dto/update-franchise.dto';
import { QueryFranchiseDto } from '@/franchises/dto/query-franchise.dto';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { Roles } from '@/roles/roles.decorator';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';
import { Permissions } from '@/user-permissions/persistence/user-permissions.decorator';

/**
 * Controller for franchise endpoints (Admin-only)
 */
@ApiTags('Franchises')
@ApiBearerAuth()
@Roles(true)
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller({
  path: 'franchises',
  version: '1',
})
export class FranchisesController {
  constructor(private readonly service: FranchisesService) {}

  /**
   * Create a new franchise
   */
  @Post()
  @Permissions({ MF01: 'Create' })
  @ApiOperation({
    summary: 'Create a new franchise',
    description:
      'Creates a new franchise with the provided details (Admin only)',
  })
  @ApiResponse({
    status: 201,
    description: 'Franchise created successfully',
    type: Franchise,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async create(
    @Body() input: CreateFranchiseDto,
    @CurrentUser() currentUser: User,
  ): Promise<Franchise> {
    return this.service.create(input, currentUser);
  }

  /**
   * Get all franchises with pagination and filters
   */
  @Get()
  @Permissions({ MF01: 'View' })
  @ApiOperation({
    summary: 'Get all franchises',
    description:
      'Retrieves all franchises with optional filtering, sorting, and pagination (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of franchises',
  })
  async findAll(@Query() query: QueryFranchiseDto): Promise<FindAllFranchise> {
    return this.service.findAll(query);
  }

  /**
   * Get franchise by ID
   */
  @Get(':id')
  @Permissions({ MF01: 'View' })
  @ApiOperation({
    summary: 'Get franchise by ID',
    description: 'Retrieves a specific franchise by ID (Admin only)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Franchise ID' })
  @ApiResponse({ status: 200, description: 'Franchise found', type: Franchise })
  @ApiResponse({ status: 404, description: 'Franchise not found' })
  async findById(@Param('id', ParseIntPipe) id: number): Promise<Franchise> {
    return this.service.findById(id);
  }

  /**
   * Get status history for a franchise
   */
  @Get(':id/status-events')
  @Permissions({ MF01: 'View' })
  @ApiOperation({
    summary: 'Get franchise status history',
    description:
      'Retrieves the status change history for a specific franchise (Admin only)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Franchise ID' })
  @ApiResponse({
    status: 200,
    description: 'Status history retrieved',
    type: [FranchiseStatusEvent],
  })
  @ApiResponse({ status: 404, description: 'Franchise not found' })
  async getStatusHistory(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<FranchiseStatusEvent[]> {
    return this.service.getStatusHistory(id);
  }

  /**
   * Update a franchise
   */
  @Put(':id')
  @Permissions({ MF01: 'Edit' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a franchise',
    description:
      'Updates an existing franchise with the provided details (Admin only)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Franchise ID' })
  @ApiResponse({
    status: 200,
    description: 'Franchise updated successfully',
    type: Franchise,
  })
  @ApiResponse({ status: 404, description: 'Franchise not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateFranchiseDto,
    @CurrentUser() currentUser: User,
  ): Promise<Franchise> {
    return this.service.update(id, input, currentUser);
  }

  /**
   * Delete a franchise (soft delete)
   */
  @Delete(':id')
  @Permissions({ MF01: 'Delete' })
  @ApiOperation({
    summary: 'Delete a franchise',
    description: 'Soft deletes a franchise (Admin only)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Franchise ID' })
  @ApiResponse({ status: 200, description: 'Franchise deleted successfully' })
  @ApiResponse({ status: 404, description: 'Franchise not found' })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    return this.service.delete(id, currentUser);
  }
}
