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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/utils/decorators/current-user.decorator';
import { User } from '@/users/domain/user';
import { Public } from '@/utils/decorators/public.decorator';
import { ReferralCodesService } from '@/referral-codes/referral-codes.service';
import { CreateReferralCodeDto } from '@/referral-codes/dto/create-referral-code.dto';
import { UpdateReferralCodeDto } from '@/referral-codes/dto/update-referral-code.dto';
import { QueryReferralCodeDto } from '@/referral-codes/dto/query-referral-code.dto';
import { ValidateReferralCodeResponseDto } from '@/referral-codes/dto/validate-referral-code-response.dto';
import { PermissionsGuard } from '@/user-permissions/user-permissions.guard';
import { Permissions } from '@/user-permissions/persistence/user-permissions.decorator';

@ApiTags('Admin - Referral Codes')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller({ path: 'admin/referral-codes', version: '1' })
export class ReferralCodesController {
  constructor(private readonly referralCodesService: ReferralCodesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a referral code' })
  @Permissions({ AC13: 'Create' })
  create(
    @Body() dto: CreateReferralCodeDto,
    @CurrentUser() causer: User,
  ) {
    return this.referralCodesService.create(dto, causer);
  }

  @Get()
  @ApiOperation({ summary: 'List referral codes (paginated)' })
  @Permissions({ AC13: 'View' })
  findAll(@Query() query: QueryReferralCodeDto) {
    return this.referralCodesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get referral code by ID' })
  @Permissions({ AC13: 'View' })
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.referralCodesService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a referral code (mutable fields only)' })
  @Permissions({ AC13: 'Edit' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReferralCodeDto,
    @CurrentUser() causer: User,
  ) {
    return this.referralCodesService.update(id, dto, causer);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a referral code' })
  @Permissions({ AC13: 'Delete' })
  async softDelete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() causer: User,
  ): Promise<void> {
    await this.referralCodesService.softDelete(id, causer);
  }

  @Get(':id/users')
  @ApiOperation({ summary: 'List users who registered via this referral code' })
  @Permissions({ AC13: 'View' })
  findUsers(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryReferralCodeDto,
  ) {
    return this.referralCodesService.findUsersForCode(id, query);
  }
}

@ApiTags('Referral Codes')
@Controller({ path: 'referral-codes', version: '1' })
export class PublicReferralCodesController {
  constructor(private readonly referralCodesService: ReferralCodesService) {}

  @Get(':code/validate')
  @Public()
  @ApiOperation({ summary: 'Validate a referral code before registration' })
  validate(@Param('code') code: string): Promise<ValidateReferralCodeResponseDto> {
    return this.referralCodesService.validateCode(code);
  }
}
