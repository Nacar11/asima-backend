import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { BaseBookingMilestoneRepository } from './persistence/base-booking-milestone.repository';
import { BookingMilestone } from './domain/booking-milestone';
import { CreateBookingMilestoneDto } from './dto/create-booking-milestone.dto';
import { UpdateBookingMilestoneDto } from './dto/update-booking-milestone.dto';
import { QueryBookingMilestoneDto } from './dto/query-booking-milestone.dto';
import { CreateFromTemplateDto } from './dto/create-from-template.dto';
import { CompleteMilestoneDto } from './dto/complete-milestone.dto';
import { ApproveMilestoneDto } from './dto/approve-milestone.dto';
import { RequestRevisionDto } from './dto/request-revision.dto';
import { StartMilestoneDto } from './dto/start-milestone.dto';
import { User } from '@/users/domain/user';
import { BookingsService } from '@/bookings/bookings.service';
import { BaseServiceMilestoneTemplateRepository } from '@/service-milestone-templates/persistence/base-service-milestone-template.repository';
import { ServiceMilestoneTemplateStatusEnum } from '@/service-milestone-templates/enums/service-milestone-template-status.enum';
import { MilestoneStatusEnum } from './enums/milestone-status.enum';
import { MilestoneTypeEnum } from './enums/milestone-type.enum';
import { ChecklistResponseTypeEnum } from './enums/checklist-response-type.enum';
import { IPaginatedResult } from '@/utils/types/paginated-result';
import { IPaginationOptions } from '@/utils/types/pagination-options';
import { QueryServiceMilestoneTemplateDto } from '@/service-milestone-templates/dto/query-service-milestone-template.dto';
import { NotificationsService } from '@/notifications/notifications.service';
import { BookingNotificationService } from '@/notifications/services/booking-notification.service';

/**
 * Booking Milestones Service.
 *
 * Handles business logic for booking milestones including creation from templates,
 * status transitions, payment validation, and auto-approval.
 *
 * @version 1
 * @since 1.0.0
 */
@Injectable()
export class BookingMilestonesService {
  constructor(
    private readonly repository: BaseBookingMilestoneRepository,
    @Inject(forwardRef(() => BookingsService))
    private readonly bookingsService: BookingsService,
    private readonly templateRepository: BaseServiceMilestoneTemplateRepository,
    private readonly notificationsService: NotificationsService,
    private readonly bookingNotificationService: BookingNotificationService,
  ) {}

  /**
   * Create booking milestones from service milestone templates.
   *
   * Creates milestones for a booking based on the service's milestone templates.
   * Validates payment percentages total 100% and calculates payment amounts.
   *
   * @param input - Create from template DTO
   * @param user - Current authenticated user
   * @returns Array of created milestones
   */
  async createFromTemplate(
    input: CreateFromTemplateDto,
    user: User,
  ): Promise<BookingMilestone[]> {
    // 1. Validate booking exists and user has access
    const booking = await this.bookingsService.findById(input.booking_id, user);

    // 2. Check if milestones already exist for this booking
    const existingMilestones = await this.repository.findByBookingId(
      input.booking_id,
    );
    if (existingMilestones.length > 0) {
      throw new BadRequestException(
        'Milestones already exist for this booking. Delete existing milestones first if you want to recreate them.',
      );
    }

    // 3. Get service milestone templates
    const queryDto: QueryServiceMilestoneTemplateDto = {
      service_id: booking.service_id,
      package_id: booking.package_id || undefined,
      status: ServiceMilestoneTemplateStatusEnum.ACTIVE,
      skip: 0,
      take: 100,
    };

    const templatesResult = await this.templateRepository.findAll(queryDto);
    const templates = templatesResult.data;

    if (templates.length === 0) {
      throw new BadRequestException(
        'No active milestone templates found for this service',
      );
    }

    // 4. Validate payment percentages total 100%
    const totalPercent = templates.reduce(
      (sum, template) => sum + Number(template.payment_percent),
      0,
    );

    if (Math.abs(totalPercent - 100) > 0.01) {
      throw new BadRequestException(
        `Milestone payment percentages must total 100%. Current total: ${totalPercent}%`,
      );
    }

    // 5. Create milestones from templates
    const createdMilestones: BookingMilestone[] = [];

    for (const template of templates) {
      const paymentAmount =
        (Number(booking.total) * Number(template.payment_percent)) / 100;

      const milestone = new BookingMilestone();
      milestone.booking_id = input.booking_id;
      milestone.template_id = template.id;
      milestone.name = template.name;
      milestone.description = template.description || null;
      milestone.sequence_order = template.sequence_order;
      milestone.status = MilestoneStatusEnum.PENDING;
      milestone.payment_percent = Number(template.payment_percent);
      milestone.payment_amount = paymentAmount;
      milestone.payment_released = false;
      milestone.auto_approved = false;
      milestone.created_by = user as any;
      // Checklist template fields (final_flow: provider fills checklist on service date)
      milestone.milestone_type =
        template.template_type ?? MilestoneTypeEnum.MILESTONE;
      milestone.category = template.category ?? null;
      milestone.response_type = template.response_type ?? null;
      milestone.measurement_unit = template.measurement_unit ?? null;
      milestone.is_required = template.is_required ?? false;

      const created = await this.repository.create(milestone);
      createdMilestones.push(created);
    }

    return createdMilestones;
  }

  /**
   * Start a milestone.
   *
   * Transitions milestone status to IN_PROGRESS and records start time.
   * Validates that previous milestones in sequence are completed.
   *
   * @param id - Milestone ID
   * @param input - Start milestone DTO
   * @param user - Current authenticated user
   * @returns Updated milestone
   */
  async startMilestone(
    id: number,
    input: StartMilestoneDto,
    user: User,
  ): Promise<BookingMilestone> {
    const milestone = await this.findById(id, user);

    // Validate milestone is in PENDING status
    if (milestone.status !== MilestoneStatusEnum.PENDING) {
      throw new BadRequestException(
        `Cannot start milestone with status: ${milestone.status}. Only PENDING milestones can be started.`,
      );
    }

    // Validate previous milestones in sequence are approved
    if (milestone.sequence_order > 1) {
      const allMilestones = await this.repository.findByBookingId(
        milestone.booking_id,
      );
      const previousMilestone = allMilestones.find(
        (m) => m.sequence_order === milestone.sequence_order - 1,
      );

      if (
        previousMilestone &&
        previousMilestone.status !== MilestoneStatusEnum.APPROVED
      ) {
        throw new BadRequestException(
          `Cannot start milestone: previous milestone "${previousMilestone.name}" must be approved first`,
        );
      }
    }

    await this.repository.update(id, {
      status: MilestoneStatusEnum.IN_PROGRESS,
      started_at: new Date(),
      provider_notes: input.notes || milestone.provider_notes,
      updated_by: user as any,
    });

    // Get updated milestone with relations for notification
    const updatedMilestone = await this.findById(id, user);

    // Send notification to buyer (MILESTONE_STARTED)
    await this.bookingNotificationService.sendMilestoneStartedNotification(
      updatedMilestone,
    );

    return updatedMilestone;
  }

  /**
   * Complete a milestone.
   *
   * Transitions milestone status to SUBMITTED and records completion time.
   *
   * @param id - Milestone ID
   * @param input - Complete milestone DTO
   * @param user - Current authenticated user
   * @returns Updated milestone
   */
  async completeMilestone(
    id: number,
    input: CompleteMilestoneDto,
    user: User,
  ): Promise<BookingMilestone> {
    const milestone = await this.findById(id, user);

    if (milestone.status !== MilestoneStatusEnum.IN_PROGRESS) {
      throw new BadRequestException(
        `Cannot complete milestone with status: ${milestone.status}`,
      );
    }

    const updateData: any = {
      status: MilestoneStatusEnum.SUBMITTED,
      completed_at: new Date(),
      submitted_at: new Date(), // Track when milestone was submitted for auto-approval
      provider_notes: input.provider_notes || milestone.provider_notes,
      updated_by: user as any,
    };

    // Save photo_urls if provided
    if (input.photo_urls && input.photo_urls.length > 0) {
      updateData.photo_urls = input.photo_urls;
    }

    await this.repository.update(id, updateData);

    // Get updated milestone with relations for notification
    const updatedMilestone = await this.findById(id, user);

    // Send notification to buyer (MILESTONE_SUBMITTED)
    await this.bookingNotificationService.sendMilestoneSubmittedNotification(
      updatedMilestone,
    );

    return updatedMilestone;
  }

  /**
   * Approve a milestone.
   *
   * Transitions milestone status to APPROVED and records approval time.
   * Can trigger payment release if configured.
   *
   * @param id - Milestone ID
   * @param input - Approve milestone DTO
   * @param user - Current authenticated user
   * @returns Updated milestone
   */
  async approveMilestone(
    id: number,
    input: ApproveMilestoneDto,
    user: User,
  ): Promise<BookingMilestone> {
    const milestone = await this.findById(id, user);

    if (milestone.status !== MilestoneStatusEnum.SUBMITTED) {
      throw new BadRequestException(
        `Cannot approve milestone with status: ${milestone.status}`,
      );
    }

    await this.repository.update(id, {
      status: MilestoneStatusEnum.APPROVED,
      approved_at: new Date(),
      approved_by: user.id,
      customer_notes: input.customer_notes || milestone.customer_notes,
      updated_by: user as any,
    });

    // Get updated milestone with relations for notification
    const updatedMilestone = await this.findById(id, user);

    // Send notification to seller (MILESTONE_APPROVED)
    await this.bookingNotificationService.sendMilestoneApprovedNotification(
      updatedMilestone,
    );

    return updatedMilestone;
  }

  /**
   * Request revision on a milestone.
   *
   * Transitions milestone status to REJECTED and records rejection reason.
   * Provider can then update and resubmit.
   *
   * @param id - Milestone ID
   * @param input - Request revision DTO
   * @param user - Current authenticated user
   * @returns Updated milestone
   */
  async requestRevision(
    id: number,
    input: RequestRevisionDto,
    user: User,
  ): Promise<BookingMilestone> {
    const milestone = await this.findById(id, user);

    if (milestone.status !== MilestoneStatusEnum.SUBMITTED) {
      throw new BadRequestException(
        `Cannot request revision on milestone with status: ${milestone.status}`,
      );
    }

    await this.repository.update(id, {
      status: MilestoneStatusEnum.REJECTED,
      rejection_reason: input.rejection_reason,
      updated_by: user as any,
    });

    // Get updated milestone with relations for notification
    const updatedMilestone = await this.findById(id, user);

    // Send notification to seller (MILESTONE_REVISION_REQUESTED)
    await this.bookingNotificationService.sendMilestoneRejectedNotification(
      updatedMilestone,
    );

    return updatedMilestone;
  }

  /**
   * Auto-approve milestones.
   *
   * This method is deprecated in favor of BookingMilestonesSchedulerService.
   * The scheduler service runs a cron job every hour to auto-approve milestones
   * that have been submitted for longer than the auto_approve_after_hours threshold.
   *
   * @deprecated Use BookingMilestonesSchedulerService.autoApproveMilestones() instead
   * @returns Number of milestones auto-approved (always 0, actual logic in scheduler)
   */
  async autoApprove(): Promise<number> {
    // Actual implementation is in BookingMilestonesSchedulerService
    // which runs as a cron job every hour
    return Promise.resolve(0);
  }

  /**
   * Validate payment percentages total 100%.
   *
   * Ensures all milestones for a booking have payment percentages that sum to 100%.
   *
   * @param bookingId - Booking ID
   * @returns True if valid, throws error if invalid
   */
  async validatePaymentPercent(bookingId: number): Promise<boolean> {
    const milestones = await this.repository.findByBookingId(bookingId);

    if (milestones.length === 0) {
      return true; // No milestones to validate
    }

    const totalPercent = milestones.reduce(
      (sum, milestone) => sum + milestone.payment_percent,
      0,
    );

    if (Math.abs(totalPercent - 100) > 0.01) {
      throw new BadRequestException(
        `Milestone payment percentages must total 100%. Current total: ${totalPercent}%`,
      );
    }

    return true;
  }

  /**
   * Find milestone by ID.
   *
   * @param id - Milestone ID
   * @param user - Current authenticated user (for authorization)
   * @returns Milestone if found
   */
  async findById(id: number, user: User): Promise<BookingMilestone> {
    const milestone = await this.repository.findById(id);

    if (!milestone) {
      throw new NotFoundException(`Booking milestone with ID ${id} not found`);
    }

    // Verify access through booking
    await this.bookingsService.findById(milestone.booking_id, user);

    // If booking access check passed, milestone is accessible
    return milestone;
  }

  /**
   * Find milestones by booking ID.
   *
   * @param bookingId - Booking ID
   * @param user - Current authenticated user (for authorization)
   * @returns Array of milestones
   */
  async findByBookingId(
    bookingId: number,
    user: User,
  ): Promise<BookingMilestone[]> {
    // Verify booking access
    await this.bookingsService.findById(bookingId, user);

    return this.repository.findByBookingId(bookingId);
  }

  /**
   * Create a booking milestone manually.
   *
   * @param input - Create milestone DTO
   * @param user - Current authenticated user
   * @returns Created milestone
   */
  async create(
    input: CreateBookingMilestoneDto,
    user: User,
  ): Promise<BookingMilestone> {
    // Validate booking exists and user has access
    await this.bookingsService.findById(input.booking_id, user);

    // Check if milestone with same booking_id and sequence_order already exists
    const existingMilestones = await this.repository.findByBookingId(
      input.booking_id,
    );
    const duplicateMilestone = existingMilestones.find(
      (m) => m.sequence_order === input.sequence_order,
    );
    if (duplicateMilestone) {
      const existingSequenceOrders = existingMilestones
        .map((m) => m.sequence_order)
        .sort((a, b) => a - b);
      const nextAvailableOrder =
        existingSequenceOrders.length > 0
          ? Math.max(...existingSequenceOrders) + 1
          : 1;
      throw new BadRequestException(
        `A milestone with sequence_order ${input.sequence_order} already exists for booking ${input.booking_id}. ` +
          `Existing sequence orders: [${existingSequenceOrders.join(', ')}]. ` +
          `Suggested next available sequence_order: ${nextAvailableOrder}`,
      );
    }

    // Validate template if provided
    if (input.template_id) {
      const template = await this.templateRepository.findById(
        input.template_id,
      );
      if (!template) {
        throw new NotFoundException(
          `Service milestone template with ID ${input.template_id} not found`,
        );
      }
    }

    // Validate payment percent
    if (input.payment_percent < 0 || input.payment_percent > 100) {
      throw new BadRequestException(
        'Payment percent must be between 0 and 100',
      );
    }

    const milestone = new BookingMilestone();
    milestone.booking_id = input.booking_id;
    milestone.template_id = input.template_id || null;
    milestone.name = input.name;
    milestone.description = input.description || null;
    milestone.sequence_order = input.sequence_order;
    milestone.status = MilestoneStatusEnum.PENDING;
    milestone.payment_percent = input.payment_percent;
    milestone.payment_amount = input.payment_amount;
    milestone.payment_released = false;
    milestone.auto_approved = false;
    milestone.created_by = user as any;

    const created = await this.repository.create(milestone);

    // Validate total payment percent after creation
    await this.validatePaymentPercent(input.booking_id);

    return created;
  }

  /**
   * Update a booking milestone.
   *
   * @param id - Milestone ID
   * @param input - Update DTO
   * @param user - Current authenticated user
   * @returns Updated milestone
   */
  async update(
    id: number,
    input: UpdateBookingMilestoneDto,
    user: User,
  ): Promise<BookingMilestone> {
    // Verify access
    await this.findById(id, user);

    const updateData: Partial<BookingMilestone> = {};

    if (input.status !== undefined) {
      updateData.status = input.status;

      // Set timestamps based on status
      if (
        input.status === MilestoneStatusEnum.IN_PROGRESS &&
        !updateData.started_at
      ) {
        updateData.started_at = new Date();
      }

      if (input.status === MilestoneStatusEnum.SUBMITTED) {
        updateData.completed_at = new Date();
      }

      if (input.status === MilestoneStatusEnum.APPROVED) {
        updateData.approved_at = new Date();
        updateData.approved_by = user.id;
      }
    }

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    if (input.provider_notes !== undefined) {
      updateData.provider_notes = input.provider_notes;
    }

    if (input.customer_notes !== undefined) {
      updateData.customer_notes = input.customer_notes;
    }

    if (input.rejection_reason !== undefined) {
      updateData.rejection_reason = input.rejection_reason;
    }

    updateData.updated_by = user as any;

    return this.repository.update(id, updateData);
  }

  /**
   * Find all booking milestones (admin only).
   *
   * @param query - Query parameters
   * @returns Paginated milestones
   */
  async findAll(
    query: QueryBookingMilestoneDto,
  ): Promise<IPaginatedResult<BookingMilestone>> {
    const paginationOptions: IPaginationOptions = {
      page: query.page || 1,
      limit: query.limit || 20,
    };

    return this.repository.findAllWithPagination({
      filterQuery: {
        status: query.status,
        booking_id: query.booking_id,
      },
      paginationOptions,
    });
  }

  // ==================== DPO Checklist Methods ====================

  /**
   * Update checklist response value.
   *
   * Updates the response value for a checklist item based on its response_type.
   *
   * @param id - Milestone ID
   * @param response - Response value (checkbox, text, rating, measurement, or photo URLs)
   * @param user - Current authenticated user
   * @returns Updated milestone
   */
  async updateChecklistResponse(
    id: number,
    response: {
      checkbox_value?: boolean;
      text_value?: string;
      rating_value?: number;
      measurement_value?: number;
      photo_urls?: string[];
    },
    user: User,
  ): Promise<BookingMilestone> {
    const milestone = await this.findById(id, user);

    // Allow both CHECKLIST and MILESTONE types to receive response updates.
    // CHECKLIST = assessment/DPO items (have response_type). MILESTONE = e.g. Maintenance/preventive
    // flow (createMilestonesFromQuotationServiceItems) where type is MILESTONE and provider marks "Done".
    const canAcceptResponse =
      milestone.milestone_type === MilestoneTypeEnum.CHECKLIST ||
      milestone.milestone_type === MilestoneTypeEnum.MILESTONE;
    if (!canAcceptResponse) {
      throw new BadRequestException('This is not a checklist item');
    }

    // Validate response matches response_type when set
    if (milestone.response_type) {
      switch (milestone.response_type) {
        case ChecklistResponseTypeEnum.CHECKBOX:
          if (response.checkbox_value === undefined) {
            throw new BadRequestException(
              'checkbox_value is required for CHECKBOX type',
            );
          }
          break;
        case ChecklistResponseTypeEnum.TEXT:
          if (!response.text_value) {
            throw new BadRequestException(
              'text_value is required for TEXT type',
            );
          }
          break;
        case ChecklistResponseTypeEnum.RATING:
          if (response.rating_value === undefined) {
            throw new BadRequestException(
              'rating_value is required for RATING type',
            );
          }
          break;
        case ChecklistResponseTypeEnum.MEASUREMENT:
          if (response.measurement_value === undefined) {
            throw new BadRequestException(
              'measurement_value is required for MEASUREMENT type',
            );
          }
          break;
        case ChecklistResponseTypeEnum.PHOTO:
          if (!response.photo_urls || response.photo_urls.length === 0) {
            throw new BadRequestException(
              'photo_urls is required for PHOTO type',
            );
          }
          break;
      }
    }

    // Update the milestone with response value
    const updateData: any = {
      checkbox_value: response.checkbox_value,
      text_value: response.text_value,
      rating_value: response.rating_value,
      measurement_value: response.measurement_value,
      photo_urls: response.photo_urls,
      status: MilestoneStatusEnum.SUBMITTED,
      completed_at: new Date(),
    };

    return this.repository.update(id, updateData);
  }

  /**
   * Get checklist completion progress.
   *
   * Returns completion percentage and list of pending items.
   *
   * @param bookingId - Booking ID
   * @returns Progress info
   */
  async getChecklistProgress(bookingId: number): Promise<{
    total_items: number;
    completed_items: number;
    required_items: number;
    required_completed: number;
    completion_percent: number;
    pending_items: BookingMilestone[];
    pending_required_items: BookingMilestone[];
  }> {
    const milestones = await this.repository.findByBookingId(bookingId);

    // Filter to checklist items only
    const checklistItems = milestones.filter(
      (m) => m.milestone_type === MilestoneTypeEnum.CHECKLIST,
    );

    const completed = checklistItems.filter(
      (m) => m.status === MilestoneStatusEnum.COMPLETED,
    );
    const pending = checklistItems.filter(
      (m) => m.status !== MilestoneStatusEnum.COMPLETED,
    );
    const required = checklistItems.filter((m) => m.is_required);
    const requiredCompleted = required.filter(
      (m) => m.status === MilestoneStatusEnum.COMPLETED,
    );
    const pendingRequired = pending.filter((m) => m.is_required);

    const total = checklistItems.length;
    const completionPercent = total > 0 ? (completed.length / total) * 100 : 0;

    return {
      total_items: total,
      completed_items: completed.length,
      required_items: required.length,
      required_completed: requiredCompleted.length,
      completion_percent: Math.round(completionPercent),
      pending_items: pending,
      pending_required_items: pendingRequired,
    };
  }

  /**
   * Validate all required checklist items are complete.
   *
   * @param bookingId - Booking ID
   * @returns True if all required items are complete
   */
  async validateRequiredComplete(bookingId: number): Promise<boolean> {
    const progress = await this.getChecklistProgress(bookingId);
    return progress.pending_required_items.length === 0;
  }
}
