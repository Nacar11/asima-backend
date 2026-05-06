import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Ip,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { AccountDeletionRequestsService } from './account-deletion-requests.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { SubmitDeletionRequestDto } from './dto/submit-deletion-request.dto';
import { CsrfGuard } from './guards/csrf.guard';

@ApiTags('Account Deletion')
@Controller({
  path: 'account-deletion-requests',
  version: '1',
})
@UseGuards(CsrfGuard)
export class AccountDeletionRequestsController {
  constructor(
    private readonly accountDeletionRequestsService: AccountDeletionRequestsService,
  ) {}

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP for account deletion verification' })
  @ApiHeader({
    name: 'x-csrf-token',
    description: 'CSRF token obtained from /csrf-token endpoint',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid email or rate limit exceeded',
  })
  @ApiResponse({
    status: 403,
    description: 'Invalid or missing CSRF token',
  })
  async sendOTP(
    @Body() sendOtpDto: SendOtpDto,
    @Ip() ipAddress: string,
  ): Promise<{
    success: boolean;
    message: string;
    expires_in_seconds: number;
  }> {
    return this.accountDeletionRequestsService.sendOTP(sendOtpDto, ipAddress);
  }

  @Post('submit')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit account deletion request' })
  @ApiHeader({
    name: 'x-csrf-token',
    description: 'CSRF token obtained from /csrf-token endpoint',
    required: true,
  })
  @ApiResponse({
    status: 201,
    description: 'Deletion request submitted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid OTP or validation errors',
  })
  @ApiResponse({
    status: 403,
    description: 'Invalid or missing CSRF token',
  })
  @ApiResponse({
    status: 409,
    description: 'Deletion request already exists',
  })
  async submitDeletionRequest(
    @Body() submitDeletionRequestDto: SubmitDeletionRequestDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<{
    success: boolean;
    message: string;
    reference_number: string;
    estimated_processing_days: number;
  }> {
    return this.accountDeletionRequestsService.submitDeletionRequest(
      submitDeletionRequestDto,
      ipAddress,
      userAgent || 'Unknown',
    );
  }
}
