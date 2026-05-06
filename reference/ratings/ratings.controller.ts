import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
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
import { RatingsService } from '@/ratings/ratings.service';
import { Rating } from '@/ratings/domain/rating';
import { RatingItem } from '@/ratings/domain/rating-item';
import { CreateRatingDto } from '@/ratings/dto/create-rating.dto';
import {
  UpdateRatingDto,
  SellerResponseDto,
} from '@/ratings/dto/update-rating.dto';
import { QueryRatingDto } from '@/ratings/dto/query-rating.dto';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { IPaginatedResult } from '@/utils/types/paginated-result';

/**
 * Ratings Controller.
 *
 * Endpoints for managing customer ratings and reviews.
 *
 * @version 1
 * @since 1.0.0
 */
@ApiTags('Ratings')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'ratings',
  version: '1',
})
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  /**
   * POST /ratings
   * Submit a new rating for a completed booking
   */
  @Post()
  @ApiOperation({
    summary: 'Submit rating',
    description: 'Customer submits a rating for a completed booking',
  })
  @ApiResponse({
    status: 201,
    description: 'Rating submitted successfully',
    type: Rating,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or booking not completed',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to rate this booking',
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async create(
    @Body() input: CreateRatingDto,
    @CurrentUser() user: User,
  ): Promise<Rating> {
    return this.ratingsService.create(input, user);
  }

  /**
   * GET /ratings
   * List ratings with optional filtering
   */
  @Get()
  @ApiOperation({
    summary: 'List ratings',
    description: 'Get ratings with optional filtering by seller or service',
  })
  @ApiResponse({
    status: 200,
    description: 'List of ratings',
  })
  async findAll(
    @Query() query: QueryRatingDto,
  ): Promise<IPaginatedResult<Rating>> {
    return this.ratingsService.findAll(query);
  }

  /**
   * GET /ratings/my-ratings
   * Get ratings submitted by the current user
   */
  @Get('my-ratings')
  @ApiOperation({
    summary: 'Get my ratings',
    description: 'Get ratings submitted by the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of user ratings',
  })
  async findMyRatings(
    @Query() query: QueryRatingDto,
    @CurrentUser() user: User,
  ): Promise<IPaginatedResult<Rating>> {
    return this.ratingsService.findByCustomer(user.id, query);
  }

  /**
   * GET /ratings/booking/:bookingId
   * Get rating for a specific booking
   */
  @Get('booking/:bookingId')
  @ApiOperation({
    summary: 'Get rating by booking',
    description: 'Get the rating for a specific booking',
  })
  @ApiParam({ name: 'bookingId', description: 'Booking ID' })
  @ApiResponse({
    status: 200,
    description: 'Rating details with items',
  })
  async findByBooking(
    @Param('bookingId', ParseIntPipe) bookingId: number,
  ): Promise<(Rating & { items: RatingItem[] }) | null> {
    return this.ratingsService.findByBookingId(bookingId);
  }

  /**
   * GET /ratings/seller/:sellerId/average
   * Get average rating for a seller
   */
  @Get('seller/:sellerId/average')
  @ApiOperation({
    summary: 'Get seller average rating',
    description: 'Get the average rating for a seller',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID' })
  @ApiResponse({
    status: 200,
    description: 'Average rating',
  })
  async getSellerAverage(
    @Param('sellerId', ParseIntPipe) sellerId: number,
  ): Promise<{ average_rating: number | null }> {
    const average = await this.ratingsService.getSellerAverageRating(sellerId);
    return { average_rating: average };
  }

  /**
   * GET /ratings/service/:serviceId/average
   * Get average rating for a service
   */
  @Get('service/:serviceId/average')
  @ApiOperation({
    summary: 'Get service average rating',
    description: 'Get the average rating for a service',
  })
  @ApiParam({ name: 'serviceId', description: 'Service ID' })
  @ApiResponse({
    status: 200,
    description: 'Average rating',
  })
  async getServiceAverage(
    @Param('serviceId', ParseIntPipe) serviceId: number,
  ): Promise<{ average_rating: number | null }> {
    const average =
      await this.ratingsService.getServiceAverageRating(serviceId);
    return { average_rating: average };
  }

  /**
   * GET /ratings/:id
   * Get a rating by ID with items
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get rating by ID' })
  @ApiParam({ name: 'id', description: 'Rating ID' })
  @ApiResponse({
    status: 200,
    description: 'Rating details with items',
  })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Rating & { items: RatingItem[] }> {
    return this.ratingsService.findById(id);
  }

  /**
   * PATCH /ratings/:id
   * Update a rating (customer updates comment/visibility)
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update rating',
    description: 'Customer updates their rating comment or visibility',
  })
  @ApiParam({ name: 'id', description: 'Rating ID' })
  @ApiResponse({
    status: 200,
    description: 'Rating updated successfully',
    type: Rating,
  })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateRatingDto,
    @CurrentUser() user: User,
  ): Promise<Rating> {
    return this.ratingsService.update(id, input, user);
  }

  /**
   * PATCH /ratings/:id/seller-response
   * Seller responds to a rating
   */
  @Patch(':id/seller-response')
  @ApiOperation({
    summary: 'Add seller response',
    description: 'Seller adds a response to a customer rating',
  })
  @ApiParam({ name: 'id', description: 'Rating ID' })
  @ApiResponse({
    status: 200,
    description: 'Seller response added successfully',
    type: Rating,
  })
  @ApiResponse({ status: 404, description: 'Not found' })
  async addSellerResponse(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: SellerResponseDto,
    @CurrentUser() user: User,
  ): Promise<Rating> {
    return this.ratingsService.addSellerResponse(id, input, user);
  }

  /**
   * DELETE /ratings/:id
   * Soft delete a rating
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete rating',
    description: 'Customer soft deletes their rating',
  })
  @ApiParam({ name: 'id', description: 'Rating ID' })
  @ApiResponse({ status: 204, description: 'Rating deleted successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.ratingsService.remove(id, user);
  }
}
