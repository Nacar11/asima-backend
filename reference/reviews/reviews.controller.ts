import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ReviewsService } from '@/reviews/reviews.service';
import { Review } from '@/reviews/domain/review';
import { FindAllReview } from '@/reviews/domain/find-all-review';
import { CreateReviewDto } from '@/reviews/dto/create-review.dto';
import { CreateBookingReviewDto } from '@/reviews/dto/create-booking-review.dto';
import { UpdateReviewDto } from '@/reviews/dto/update-review.dto';
import { ReplyToReviewDto } from '@/reviews/dto/reply-to-review.dto';
import { UpdateReviewStatusDto } from '@/reviews/dto/update-review-status.dto';
import { QueryReviewDto } from '@/reviews/dto/query-review.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';
import { Permissions } from '@/user-permissions/persistence/user-permissions.decorator';

/**
 * Controller for review endpoints
 */
@ApiTags('Reviews')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller({
  path: 'reviews',
  version: '1',
})
export class ReviewsController {
  constructor(private readonly service: ReviewsService) {}

  /**
   * Create a new review
   * Note: No permission required - any authenticated user can review their own purchases.
   * The service validates ownership and completion status.
   */
  @Post()
  @ApiOperation({
    summary: 'Create a new review',
    description:
      'Creates a new review with the provided details and optional images',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Review created successfully',
    type: Review,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @UseInterceptors(FilesInterceptor('files', 5)) // Allow up to 5 files
  async create(
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
      }),
    )
    input: CreateReviewDto,
    @CurrentUser() currentUser: User,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<Review> {
    return this.service.create(input, currentUser, files);
  }

  /**
   * Get all reviews
   */
  @Get()
  @ApiOperation({
    summary: 'Get all reviews',
    description: 'Retrieves all reviews with optional filtering and pagination',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in review comments',
  })
  @ApiQuery({
    name: 'user_id',
    required: false,
    type: Number,
    description: 'Filter by user ID',
  })
  @ApiQuery({
    name: 'seller_id',
    required: false,
    type: Number,
    description: 'Filter by seller ID',
  })
  @ApiQuery({
    name: 'product_id',
    required: false,
    type: Number,
    description: 'Filter by product ID',
  })
  @ApiQuery({
    name: 'rating',
    required: false,
    type: Number,
    description: 'Filter by rating (1-5)',
  })
  @ApiQuery({
    name: 'is_anonymous',
    required: false,
    type: Boolean,
    description: 'Filter by anonymous status',
  })
  @ApiQuery({
    name: 'is_verified_purchase',
    required: false,
    type: Boolean,
    description: 'Filter by verified purchase status',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['Active', 'Removed'],
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    example: 0,
    description: 'Number of items to skip (default: 0)',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    example: 20,
    description: 'Number of items to take/return (default: 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of categories',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array' },
        totalCount: { type: 'number' },
        skip: { type: 'number' },
        take: { type: 'number' },
      },
    },
  })
  async findAll(
    @Query(new ValidationPipe({ transform: true })) query: QueryReviewDto,
  ): Promise<FindAllReview> {
    return this.service.findAll(query);
  }

  /**
   * Get review by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get review by ID',
    description: 'Retrieves a specific review by their ID',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Review ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Review found',
    type: Review,
  })
  @ApiResponse({
    status: 404,
    description: 'Review not found',
  })
  async findById(@Param('id', ParseIntPipe) id: number): Promise<Review> {
    return this.service.findOne(id);
  }

  /**
   * Update a review
   */
  @Patch(':id')
  @Permissions({ AC03: 'Edit' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a review',
    description:
      'Updates a review (limited fields: rating, comment, is_anonymous)',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Review ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Review updated successfully',
    type: Review,
  })
  @ApiResponse({
    status: 404,
    description: 'Review not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) input: UpdateReviewDto,
    @CurrentUser() currentUser: User,
  ): Promise<Review> {
    return this.service.update(id, input, currentUser);
  }

  /**
   * Delete a review
   */
  @Delete(':id')
  @Permissions({ AC03: 'Delete' })
  @ApiOperation({
    summary: 'Delete a review',
    description: 'Hard deletes a review (only by review owner)',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Review ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Review deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Review not found',
  })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    return this.service.remove(id, currentUser);
  }

  /**
   * Update review status (Admin only)
   */
  @Patch(':id/status')
  @Permissions({ AC03: 'Edit' })
  @ApiOperation({
    summary: 'Update review status',
    description: 'Updates review status (Active/Removed) - System Admin only',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Review ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Review status updated successfully',
    type: Review,
  })
  @ApiResponse({
    status: 404,
    description: 'Review not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or insufficient permissions',
  })
  async updateReviewStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() statusDto: UpdateReviewStatusDto,
    @CurrentUser() currentUser: User,
  ): Promise<Review> {
    return this.service.updateReviewStatus(id, statusDto.status, currentUser);
  }

  /**
   * Reply to a review
   */
  @Patch(':id/reply')
  @Permissions({ AC03: 'Edit' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reply to a review',
    description: 'Adds a seller reply to a review',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Review ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Reply added successfully',
    type: Review,
  })
  @ApiResponse({
    status: 404,
    description: 'Review not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  async replyToReview(
    @Param('id', ParseIntPipe) id: number,
    @Body() replyDto: ReplyToReviewDto,
    @CurrentUser() currentUser: User,
  ): Promise<Review> {
    return this.service.replyToReview(id, replyDto.reply_text, currentUser);
  }

  /**
   * Create a review from a booking
   */
  @Post('bookings/:id/review')
  @Permissions({ AC03: 'Create' })
  @ApiOperation({
    summary: 'Create a review from a booking',
    description:
      'Creates a review for a completed booking with optional images and aspect ratings',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Booking ID',
  })
  @ApiResponse({
    status: 201,
    description: 'Review created successfully',
    type: Review,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or booking not completed',
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Review already exists for this booking',
  })
  @UseInterceptors(FilesInterceptor('files', 5)) // Allow up to 5 files
  async createBookingReview(
    @Param('id', ParseIntPipe) bookingId: number,
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
      }),
    )
    input: CreateBookingReviewDto,
    @CurrentUser() currentUser: User,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<Review> {
    return this.service.createBookingReview(
      bookingId,
      input,
      currentUser,
      files,
    );
  }

  /**
   * Get reviews for a service
   */
  @Get('services/:id/reviews')
  @ApiOperation({
    summary: 'Get reviews for a service',
    description: 'Retrieves all active reviews for a specific service',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Service ID',
  })
  @ApiResponse({
    status: 200,
    description: 'List of reviews',
    schema: {
      type: 'array',
      items: { $ref: '#/components/schemas/Review' },
    },
  })
  async getServiceReviews(
    @Param('id', ParseIntPipe) serviceId: number,
  ): Promise<Review[]> {
    return this.service.findByService(serviceId);
  }

  /**
   * Get reviews for a seller
   */
  @Get('sellers/:id/reviews')
  @ApiOperation({
    summary: 'Get reviews for a seller',
    description: 'Retrieves all active reviews for a specific seller',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Seller ID',
  })
  @ApiResponse({
    status: 200,
    description: 'List of reviews',
    schema: {
      type: 'array',
      items: { $ref: '#/components/schemas/Review' },
    },
  })
  async getSellerReviews(
    @Param('id', ParseIntPipe) sellerId: number,
  ): Promise<Review[]> {
    return this.service.findBySeller(sellerId);
  }
}
