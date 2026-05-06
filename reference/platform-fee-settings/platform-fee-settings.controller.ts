import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SystemAdminGuard } from '@/users/user.guard';
import { SystemAdmin } from '@/users/users.decorator';
import { PlatformFeeSettingsService } from '@/platform-fee-settings/platform-fee-settings.service';
import { PlatformFeeSettingsDto } from '@/platform-fee-settings/dto/platform-fee-settings.dto';

@ApiTags('Admin Store Settings')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), SystemAdminGuard)
@SystemAdmin(true)
@Controller({ path: 'admin/store-settings/platform-fee', version: '1' })
export class PlatformFeeSettingsController {
  constructor(
    private readonly platformFeeSettingsService: PlatformFeeSettingsService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get global platform fee settings' })
  @ApiOkResponse({ type: PlatformFeeSettingsDto })
  getSettings(): Promise<PlatformFeeSettingsDto> {
    return this.platformFeeSettingsService.getSettings();
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update global platform fee settings' })
  @ApiOkResponse({ type: PlatformFeeSettingsDto })
  updateSettings(
    @Body() input: PlatformFeeSettingsDto,
  ): Promise<PlatformFeeSettingsDto> {
    return this.platformFeeSettingsService.updateSettings(input);
  }
}
