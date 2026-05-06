import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { QueryNotificationDto } from './dto/query-notification.dto';
import {
  RegisterFcmTokenDto,
  DeactivateFcmTokenDto,
} from './dto/register-fcm-token.dto';
import { Notification } from './domain/notification';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { FcmTokenService } from './services/fcm-token.service';
import { CreateNotificationDto } from '@/notifications/dto/create-notification.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'notifications',
  version: '1',
})
export class NotificationsController {
  constructor(
    private readonly service: NotificationsService,
    private readonly fcmTokenService: FcmTokenService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    type: Notification,
    description: 'Notification created successfully',
  })
  create(@Body() dto: CreateNotificationDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOkResponse({
    type: Notification,
    isArray: true,
    description: 'List of notifications for current user',
  })
  findAll(@Query() query: QueryNotificationDto, @CurrentUser() user: User) {
    return this.service.findByUser(user.id, query, user.system_admin);
  }

  @Get('unread-count')
  @ApiOkResponse({
    description: 'Unread notification count',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number' },
      },
    },
  })
  getUnreadCount(@CurrentUser() user: User) {
    return this.service
      .getUnreadCount(user.id, user.system_admin)
      .then((count) => ({ count }));
  }

  // ==================== FCM Token Endpoints (must be before :id routes) ====================

  @Post('fcm-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register FCM device token for push notifications' })
  @ApiCreatedResponse({ description: 'Token registered successfully' })
  registerFcmToken(
    @Body() dto: RegisterFcmTokenDto,
    @CurrentUser() user: User,
  ) {
    return this.fcmTokenService.registerToken(user.id, dto);
  }

  @Delete('fcm-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate FCM device token' })
  @ApiNoContentResponse({ description: 'Token deactivated' })
  async deactivateFcmToken(
    @Body() dto: DeactivateFcmTokenDto,
    @CurrentUser() user: User,
  ): Promise<void> {
    // Verify token ownership before deactivation
    const userDevices = await this.fcmTokenService.getUserDevices(user.id);
    const ownsToken = userDevices.some(
      (device) => device.device_token === dto.device_token,
    );

    if (!ownsToken) {
      throw new ForbiddenException(
        'Token not found or does not belong to current user',
      );
    }

    return this.fcmTokenService.deactivateToken(dto.device_token);
  }

  @Get('fcm-token/devices')
  @ApiOperation({ summary: 'Get user device tokens' })
  @ApiOkResponse({ description: 'List of user devices' })
  getUserDevices(@CurrentUser() user: User) {
    return this.fcmTokenService.getUserDevices(user.id);
  }

  // ==================== Static Routes (before parameterized routes) ====================

  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOkResponse({
    description: 'All notifications marked as read',
  })
  markAllAsRead(@CurrentUser() user: User) {
    return this.service.markAllAsRead(user.id);
  }

  // ==================== Parameterized Routes ====================

  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    description: 'Notification marked as read',
  })
  markAsRead(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.service.markAsRead(id, user.id);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    type: Notification,
    description: 'Notification details',
  })
  findById(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.service.findById(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', type: Number })
  @ApiNoContentResponse({ description: 'Notification deleted' })
  delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.service.delete(id, user.id);
  }
}
