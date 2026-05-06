import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { DisputeMessagesService } from './dispute-messages.service';
import { CreateDisputeMessageDto } from './dto/create-dispute-message.dto';
import { DisputeMessage } from './domain/dispute-message';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';

/**
 * DisputeMessages Controller.
 *
 * Handles threaded conversation messages within a dispute.
 * Endpoints:
 *   GET  /v1/disputes/:disputeId/messages  — list all messages
 *   POST /v1/disputes/:disputeId/messages  — post a new message
 *
 * @version 1
 * @since 1.0.0
 */
@ApiTags('Dispute Messages')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'disputes/:disputeId/messages',
  version: '1',
})
export class DisputeMessagesController {
  constructor(private readonly service: DisputeMessagesService) {}

  /**
   * GET /disputes/:disputeId/messages
   * List all messages in a dispute thread, oldest-first.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'disputeId', type: Number })
  @ApiOkResponse({ type: [DisputeMessage] })
  getMessages(
    @Param('disputeId', ParseIntPipe) disputeId: number,
    @CurrentUser() user: User,
  ): Promise<DisputeMessage[]> {
    return this.service.getMessages(disputeId, user);
  }

  /**
   * POST /disputes/:disputeId/messages
   * Post a new message to the dispute thread.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({ name: 'disputeId', type: Number })
  @ApiCreatedResponse({ type: DisputeMessage })
  createMessage(
    @Param('disputeId', ParseIntPipe) disputeId: number,
    @Body() dto: CreateDisputeMessageDto,
    @CurrentUser() user: User,
  ): Promise<DisputeMessage> {
    return this.service.createMessage(disputeId, dto, user);
  }
}
