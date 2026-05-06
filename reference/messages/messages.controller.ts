import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { MessagesService } from '@/messages/messages.service';
import { Conversation } from '@/messages/domain/conversation';
import { Message } from '@/messages/domain/message';
import { CreateConversationDto } from '@/messages/dto/create-conversation.dto';
import { SendMessageDto } from '@/messages/dto/send-message.dto';
import { QueryConversationsDto } from '@/messages/dto/query-conversations.dto';
import { QueryMessagesDto } from '@/messages/dto/query-messages.dto';
import { MarkAsReadDto } from '@/messages/dto/mark-as-read.dto';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import {
  PaginatedResponseDto,
  PaginatedResponse,
} from '@/utils/dto/paginated-response.dto';
import { paginate } from '@/utils/paginate';
import { IPaginatedResult } from '@/utils/types/paginated-result';

/**
 * Messages Controller.
 *
 * Handles HTTP endpoints for in-app messaging functionality.
 *
 * @version 1
 * @since 1.0.0
 */
@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'messages',
  version: '1',
})
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('conversations')
  @ApiOperation({
    summary: 'Start a new conversation',
    description:
      'Creates a new conversation between a seller and customer. Returns existing conversation if one already exists.',
  })
  @ApiCreatedResponse({
    type: Conversation,
    description: 'Conversation created or retrieved successfully',
  })
  async startConversation(
    @Body() dto: CreateConversationDto,
    @CurrentUser() user: User,
  ): Promise<Conversation> {
    return this.messagesService.startConversation(dto, user);
  }

  @Get('conversations')
  @ApiOperation({
    summary: 'Get conversations list',
    description:
      'Returns all conversations for the current user (as seller or customer)',
  })
  @ApiOkResponse({
    type: PaginatedResponse(Conversation),
  })
  async getConversations(
    @Query() dto: QueryConversationsDto,
    @CurrentUser() user: User,
  ): Promise<PaginatedResponseDto<Conversation>> {
    const page = dto.page ?? 1;
    const limit = Math.min(dto.limit ?? 20, 50);

    const result: IPaginatedResult<Conversation> =
      await this.messagesService.getConversations(dto, user);

    return paginate(result, { page, limit });
  }

  @Get('conversations/:id')
  @ApiOperation({
    summary: 'Get conversation by ID',
    description: 'Returns a conversation with unread count',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    type: Conversation,
  })
  async getConversation(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<Conversation> {
    return this.messagesService.getConversation(id, user);
  }

  @Post('conversations/:id/archive')
  @ApiOperation({
    summary: 'Archive conversation',
    description: 'Archives a conversation for the current user',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    type: Conversation,
  })
  async archiveConversation(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<Conversation> {
    return this.messagesService.archiveConversation(id, user);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({
    summary: 'Get conversation messages',
    description: 'Returns paginated messages for a conversation',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    type: PaginatedResponse(Message),
  })
  async getMessages(
    @Param('id', ParseIntPipe) conversationId: number,
    @Query() dto: QueryMessagesDto,
    @CurrentUser() user: User,
  ): Promise<PaginatedResponseDto<Message>> {
    const page = dto.page ?? 1;
    const limit = Math.min(dto.limit ?? 50, 100);

    const result: IPaginatedResult<Message> =
      await this.messagesService.getMessages(conversationId, dto, user);

    return paginate(result, { page, limit });
  }

  @Post('messages')
  @ApiOperation({
    summary: 'Send a message',
    description: 'Sends a message in a conversation',
  })
  @ApiCreatedResponse({
    type: Message,
    description: 'Message sent successfully',
  })
  async sendMessage(
    @Body() dto: SendMessageDto,
    @CurrentUser() user: User,
  ): Promise<Message> {
    return this.messagesService.sendMessage(dto, user);
  }

  @Post('conversations/:id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Mark messages as read',
    description:
      'Marks specific messages or all unread messages in a conversation as read',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    description: 'Messages marked as read successfully',
  })
  async markAsRead(
    @Param('id', ParseIntPipe) conversationId: number,
    @Body() dto: MarkAsReadDto,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.messagesService.markAsRead(conversationId, dto, user);
  }
}
