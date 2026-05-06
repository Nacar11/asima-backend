import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BookingMilestonesService } from './booking-milestones.service';
import { BookingMilestone } from './domain/booking-milestone';
import { CreateBookingMilestoneDto } from './dto/create-booking-milestone.dto';
import { UpdateBookingMilestoneDto } from './dto/update-booking-milestone.dto';
import { QueryBookingMilestoneDto } from './dto/query-booking-milestone.dto';
import { CreateFromTemplateDto } from './dto/create-from-template.dto';
import { CompleteMilestoneDto } from './dto/complete-milestone.dto';
import { ApproveMilestoneDto } from './dto/approve-milestone.dto';
import { RequestRevisionDto } from './dto/request-revision.dto';
import { StartMilestoneDto } from './dto/start-milestone.dto';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { Throttle } from '@nestjs/throttler';

/**
 * Booking Milestones Controller.
 *
 * Handles endpoints for booking milestones that track service booking progress
 * through milestone-based workflows.
 *
 * @version 1
 * @since 1.0.0
 */
@ApiTags('Booking Milestones')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'booking-milestones',
  version: '1',
})
export class BookingMilestonesController {
  constructor(
    private readonly bookingMilestonesService: BookingMilestonesService,
  ) {}

  /**
   * POST /booking-milestones
   * Create booking milestone manually
   */
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Create booking milestone',
    description:
      'Create a booking milestone manually. Validates payment percentages.',
  })
  @ApiResponse({
    status: 201,
    description: 'Milestone created successfully',
    type: BookingMilestone,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or validation failed',
  })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  async create(
    @Body() input: CreateBookingMilestoneDto,
    @CurrentUser() user: User,
  ): Promise<BookingMilestone> {
    return this.bookingMilestonesService.create(input, user);
  }

  /**
   * POST /booking-milestones/from-template
   * Create milestones from service templates
   */
  @Post('from-template')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Create milestones from template',
    description:
      'Create booking milestones from service milestone templates. Validates payment percentages total 100%.',
  })
  @ApiResponse({
    status: 201,
    description: 'Milestones created successfully',
    type: [BookingMilestone],
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or validation failed',
  })
  async createFromTemplate(
    @Body() input: CreateFromTemplateDto,
    @CurrentUser() user: User,
  ): Promise<BookingMilestone[]> {
    return this.bookingMilestonesService.createFromTemplate(input, user);
  }

  /**
   * GET /booking-milestones
   * Get all booking milestones (admin only)
   */
  @Get()
  @ApiOperation({
    summary: 'Get all booking milestones',
    description: 'Get all booking milestones with pagination (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of booking milestones',
  })
  async findAll(
    @Query() query: QueryBookingMilestoneDto,
  ): Promise<IPaginatedResult<BookingMilestone>> {
    return this.bookingMilestonesService.findAll(query);
  }

  /**
   * GET /booking-milestones/booking/:bookingId
   * Get milestones for a booking
   */
  @Get('booking/:bookingId')
  @ApiOperation({
    summary: 'Get milestones by booking',
    description: 'Get all milestones for a specific booking',
  })
  @ApiResponse({
    status: 200,
    description: 'List of milestones',
    type: [BookingMilestone],
  })
  async findByBooking(
    @Param('bookingId', ParseIntPipe) bookingId: number,
    @CurrentUser() user: User,
  ): Promise<BookingMilestone[]> {
    return this.bookingMilestonesService.findByBookingId(bookingId, user);
  }

  /**
   * GET /booking-milestones/:id
   * Get milestone by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get milestone by ID',
    description:
      'Get milestone details. Accessible by customer, seller, or assigned member.',
  })
  @ApiResponse({
    status: 200,
    description: 'Milestone details',
    type: [BookingMilestone],
  })
  @ApiResponse({ status: 404, description: 'Milestone not found' })
  async findById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<BookingMilestone[]> {
    const milestone = await this.bookingMilestonesService.findById(id, user);
    return [milestone];
  }

  /**
   * PATCH /booking-milestones/:id
   * Update milestone
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update milestone',
    description:
      'Update milestone details, status, or notes. Accessible by customer, seller, or assigned member.',
  })
  @ApiResponse({
    status: 200,
    description: 'Milestone updated',
    type: BookingMilestone,
  })
  @ApiResponse({ status: 404, description: 'Milestone not found' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateBookingMilestoneDto,
    @CurrentUser() user: User,
  ): Promise<BookingMilestone> {
    return this.bookingMilestonesService.update(id, input, user);
  }

  /**
   * PATCH /booking-milestones/:id/start
   * Start a milestone
   */
  @Patch(':id/start')
  @ApiOperation({
    summary: 'Start milestone',
    description:
      'Start working on a milestone. Validates that previous milestones in sequence are completed. Transitions status to IN_PROGRESS. Only accessible by seller or assigned member.',
  })
  @ApiResponse({
    status: 200,
    description: 'Milestone started',
    type: BookingMilestone,
  })
  @ApiResponse({ status: 400, description: 'Milestone cannot be started' })
  @ApiResponse({ status: 404, description: 'Milestone not found' })
  async startMilestone(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: StartMilestoneDto,
    @CurrentUser() user: User,
  ): Promise<BookingMilestone> {
    return this.bookingMilestonesService.startMilestone(id, input, user);
  }

  /**
   * PATCH /booking-milestones/:id/complete
   * Complete a milestone
   */
  @Patch(':id/complete')
  @ApiOperation({
    summary: 'Complete milestone',
    description:
      'Mark milestone as completed and submit for review. Transitions status to SUBMITTED. Only accessible by seller or assigned member.',
  })
  @ApiResponse({
    status: 200,
    description: 'Milestone completed',
    type: BookingMilestone,
  })
  @ApiResponse({ status: 400, description: 'Milestone cannot be completed' })
  @ApiResponse({ status: 404, description: 'Milestone not found' })
  async completeMilestone(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: CompleteMilestoneDto,
    @CurrentUser() user: User,
  ): Promise<BookingMilestone> {
    return this.bookingMilestonesService.completeMilestone(id, input, user);
  }

  /**
   * PATCH /booking-milestones/:id/approve
   * Approve a milestone
   */
  @Patch(':id/approve')
  @ApiOperation({
    summary: 'Approve milestone',
    description:
      'Approve a submitted milestone. Transitions status to APPROVED. Only accessible by customer.',
  })
  @ApiResponse({
    status: 200,
    description: 'Milestone approved',
    type: BookingMilestone,
  })
  @ApiResponse({ status: 400, description: 'Milestone cannot be approved' })
  @ApiResponse({ status: 404, description: 'Milestone not found' })
  async approveMilestone(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: ApproveMilestoneDto,
    @CurrentUser() user: User,
  ): Promise<BookingMilestone> {
    return this.bookingMilestonesService.approveMilestone(id, input, user);
  }

  /**
   * PATCH /booking-milestones/:id/request-revision
   * Request revision on a milestone
   */
  @Patch(':id/request-revision')
  @ApiOperation({
    summary: 'Request revision',
    description:
      'Request revision on a submitted milestone. Transitions status to REJECTED. Only accessible by customer.',
  })
  @ApiResponse({
    status: 200,
    description: 'Revision requested',
    type: BookingMilestone,
  })
  @ApiResponse({ status: 400, description: 'Cannot request revision' })
  @ApiResponse({ status: 404, description: 'Milestone not found' })
  async requestRevision(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: RequestRevisionDto,
    @CurrentUser() user: User,
  ): Promise<BookingMilestone> {
    return this.bookingMilestonesService.requestRevision(id, input, user);
  }

  // ==================== DPO Checklist Endpoints ====================

  /**
   * PATCH /booking-milestones/:id/response
   * Update checklist response value
   */
  @Patch(':id/response')
  @ApiOperation({
    summary: 'Update checklist response',
    description:
      'Updates the response value for a checklist item. The response field depends on the response_type.',
  })
  @ApiResponse({
    status: 200,
    description: 'Response updated',
    type: BookingMilestone,
  })
  @ApiResponse({
    status: 400,
    description: 'Not a checklist item or invalid response',
  })
  @ApiResponse({ status: 404, description: 'Milestone not found' })
  async updateChecklistResponse(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    response: {
      checkbox_value?: boolean;
      text_value?: string;
      rating_value?: number;
      measurement_value?: number;
      photo_urls?: string[];
    },
    @CurrentUser() user: User,
  ): Promise<BookingMilestone> {
    return this.bookingMilestonesService.updateChecklistResponse(
      id,
      response,
      user,
    );
  }

  /**
   * GET /booking-milestones/booking/:bookingId/progress
   * Get checklist completion progress
   */
  @Get('booking/:bookingId/progress')
  @ApiOperation({
    summary: 'Get checklist progress',
    description: 'Returns completion percentage and pending checklist items',
  })
  @ApiResponse({
    status: 200,
    description: 'Progress info',
  })
  async getChecklistProgress(
    @Param('bookingId', ParseIntPipe) bookingId: number,
  ) {
    return this.bookingMilestonesService.getChecklistProgress(bookingId);
  }
}
