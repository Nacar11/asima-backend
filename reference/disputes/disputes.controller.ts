import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { DisputesService } from './disputes.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { QueryDisputeDto } from './dto/query-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { ProviderRespondDisputeDto } from './dto/provider-respond-dispute.dto';
import { CustomerReplyDisputeDto } from './dto/customer-reply-dispute.dto';
import { Dispute } from './domain/dispute';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';

/**
 * Disputes Controller.
 *
 * Handles endpoints for customer-initiated disputes on completed bookings.
 * Provides CRUD operations for disputes, evidence management, provider
 * responses, and admin resolution.
 *
 * @version 1
 * @since 1.0.0
 */
@ApiTags('Disputes')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'disputes',
  version: '1',
})
export class DisputesController {
  constructor(private readonly service: DisputesService) {}

  /**
   * POST /disputes
   * Create a new dispute (customer).
   */
  @Post()
  @ApiCreatedResponse({
    type: Dispute,
    description: 'Dispute created successfully',
  })
  create(
    @Body() dto: CreateDisputeDto,
    @CurrentUser() user: User,
  ): Promise<Dispute> {
    return this.service.createDispute(dto, user);
  }

  /**
   * GET /disputes
   * Find all disputes (admin).
   */
  @Get()
  @ApiOkResponse({
    type: Dispute,
    isArray: true,
    description: 'List of disputes',
  })
  findAll(@Query() query: QueryDisputeDto) {
    return this.service.findAll(query);
  }

  /**
   * GET /disputes/my
   * Find disputes for current customer.
   */
  @Get('my')
  @ApiOkResponse({
    type: Dispute,
    isArray: true,
    description: 'Customer disputes',
  })
  findMyDisputes(@Query() query: QueryDisputeDto, @CurrentUser() user: User) {
    return this.service.findByCustomerId(user.id, query);
  }

  /**
   * GET /disputes/seller/:sellerId
   * Find disputes by seller ID (provider).
   */
  @Get('seller/:sellerId')
  @ApiParam({ name: 'sellerId', type: Number })
  @ApiOkResponse({
    type: Dispute,
    isArray: true,
    description: 'Provider disputes',
  })
  findBySellerId(
    @Param('sellerId', ParseIntPipe) sellerId: number,
    @Query() query: QueryDisputeDto,
  ) {
    return this.service.findBySellerId(sellerId, query);
  }

  /**
   * GET /disputes/booking/:bookingId
   * Find dispute by booking ID.
   */
  @Get('booking/:bookingId')
  @ApiParam({ name: 'bookingId', type: Number })
  @ApiOkResponse({
    type: Dispute,
    description: 'Dispute for booking',
  })
  findByBookingId(
    @Param('bookingId', ParseIntPipe) bookingId: number,
  ): Promise<Dispute | null> {
    return this.service.findByBookingId(bookingId);
  }

  /**
   * GET /disputes/:id
   * Find dispute by ID.
   */
  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    type: Dispute,
    description: 'Dispute details',
  })
  findById(@Param('id', ParseIntPipe) id: number): Promise<Dispute> {
    return this.service.findById(id);
  }

  /**
   * PATCH /disputes/:id/evidence
   * Add customer evidence to a dispute.
   */
  @Patch(':id/evidence')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    type: Dispute,
    description: 'Evidence added successfully',
  })
  addEvidence(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      evidence_urls?: string[];
      provider_evidence_urls?: string[];
    },
    @CurrentUser() user: User,
  ): Promise<Dispute> {
    const evidenceUrls =
      body.evidence_urls ?? body.provider_evidence_urls ?? [];
    return this.service.addEvidence(id, evidenceUrls, user);
  }

  /**
   * PATCH /disputes/:id/respond
   * Provider responds to a dispute.
   */
  @Patch(':id/respond')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    type: Dispute,
    description: 'Provider response submitted successfully',
  })
  respondToDispute(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ProviderRespondDisputeDto,
    @CurrentUser() user: User,
  ): Promise<Dispute> {
    return this.service.respondToDispute(id, dto, user);
  }

  /**
   * PATCH /disputes/:id/customer-reply
   * Customer replies to provider's dispute response.
   */
  @Patch(':id/customer-reply')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    type: Dispute,
    description: 'Customer reply submitted successfully',
  })
  customerReply(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CustomerReplyDisputeDto,
    @CurrentUser() user: User,
  ): Promise<Dispute> {
    return this.service.customerReplyToDispute(id, dto, user);
  }

  /**
   * PATCH /disputes/:id/provider-evidence
   * Add provider evidence to a dispute.
   */
  @Patch(':id/provider-evidence')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    type: Dispute,
    description: 'Provider evidence added successfully',
  })
  addProviderEvidence(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      evidence_urls?: string[];
      provider_evidence_urls?: string[];
    },
    @CurrentUser() user: User,
  ): Promise<Dispute> {
    const evidenceUrls =
      body.evidence_urls ?? body.provider_evidence_urls ?? [];
    return this.service.addProviderEvidence(id, evidenceUrls, user);
  }

  /**
   * PATCH /disputes/:id/resolve
   * Resolve a dispute (admin).
   */
  @Patch(':id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    type: Dispute,
    description: 'Dispute resolved successfully',
  })
  resolveDispute(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResolveDisputeDto,
    @CurrentUser() user: User,
  ): Promise<Dispute> {
    return this.service.resolveDispute(id, dto, user);
  }
}
