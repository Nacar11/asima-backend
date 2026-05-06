import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { randomUUID } from 'crypto';
import { AccountDeletionRequestEntity } from './persistence/relational/entities/account-deletion-request.entity';
import { DeletionOtpEntity } from './persistence/relational/entities/deletion-otp.entity';
import { SendOtpDto } from './dto/send-otp.dto';
import { SubmitDeletionRequestDto } from './dto/submit-deletion-request.dto';
import { MailService } from '@/mail/mail.service';
import { AccountDeletionStatus } from './domain/account-deletion-request';

@Injectable()
export class AccountDeletionRequestsService {
  constructor(
    @InjectRepository(AccountDeletionRequestEntity)
    private readonly deletionRequestRepository: Repository<AccountDeletionRequestEntity>,
    @InjectRepository(DeletionOtpEntity)
    private readonly otpRepository: Repository<DeletionOtpEntity>,
    private readonly mailService: MailService,
  ) {}

  async sendOTP(
    dto: SendOtpDto,
    ipAddress: string,
  ): Promise<{
    success: boolean;
    message: string;
    expires_in_seconds: number;
  }> {
    const { email } = dto;

    // Check rate limiting - max 3 OTPs per email per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOtps = await this.otpRepository.count({
      where: {
        email,
        created_at: MoreThan(oneHourAgo) as any,
      },
    });

    if (recentOtps >= 3) {
      throw new BadRequestException(
        'Too many attempts. Please try again later.',
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiration to 5 minutes from now
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Delete any existing unverified OTPs for this email
    await this.otpRepository.delete({
      email,
      verified: false,
    });

    // Save OTP to database
    const otpEntity = this.otpRepository.create({
      email,
      otp,
      expires_at: expiresAt,
      verified: false,
      ip_address: ipAddress,
    });

    await this.otpRepository.save(otpEntity);

    // Send OTP email
    await this.mailService.sendAccountDeletionOTP(email, otp);

    return {
      success: true,
      message: 'Verification code sent to your email',
      expires_in_seconds: 300,
    };
  }

  async verifyOTP(email: string, otp: string): Promise<boolean> {
    const otpEntity = await this.otpRepository.findOne({
      where: {
        email,
        otp,
        verified: false,
      },
    });

    if (!otpEntity) {
      return false;
    }

    // Check if OTP is expired
    if (new Date() > otpEntity.expires_at) {
      return false;
    }

    // Mark OTP as verified
    otpEntity.verified = true;
    await this.otpRepository.save(otpEntity);

    return true;
  }

  async submitDeletionRequest(
    dto: SubmitDeletionRequestDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<{
    success: boolean;
    message: string;
    reference_number: string;
    estimated_processing_days: number;
  }> {
    // Verify OTP
    const isOtpValid = await this.verifyOTP(dto.email, dto.otp);
    if (!isOtpValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Check if deletion request already exists for this email
    const existingRequest = await this.deletionRequestRepository.findOne({
      where: {
        email: dto.email,
        status: AccountDeletionStatus.PENDING,
      },
    });

    if (existingRequest) {
      throw new ConflictException(
        'A deletion request for this email already exists',
      );
    }

    // Generate reference number
    const referenceNumber = this.generateReferenceNumber();

    // Create deletion request
    const deletionRequest = this.deletionRequestRepository.create({
      email: dto.email,
      full_name: dto.full_name,
      phone_number: dto.phone_number,
      account_type: dto.account_type,
      reason: dto.reason,
      additional_comments: dto.additional_comments,
      ip_address: ipAddress,
      user_agent: userAgent,
      status: AccountDeletionStatus.PENDING,
      reference_number: referenceNumber,
    });

    await this.deletionRequestRepository.save(deletionRequest);

    // Send confirmation email to user
    await this.mailService.sendAccountDeletionConfirmation(
      dto.email,
      referenceNumber,
      dto.full_name,
    );

    // Send notification to admin
    await this.mailService.sendAccountDeletionAdminNotification({
      email: dto.email,
      full_name: dto.full_name,
      reason: dto.reason,
      reference_number: referenceNumber,
      created_at: deletionRequest.created_at,
    });

    // Clean up verified OTP
    await this.otpRepository.delete({
      email: dto.email,
      verified: true,
    });

    return {
      success: true,
      message:
        'Your account deletion request has been received and will be processed within 30 days.',
      reference_number: referenceNumber,
      estimated_processing_days: 30,
    };
  }

  private generateReferenceNumber(): string {
    const year = new Date().getFullYear();
    const uuid = randomUUID().replace(/-/g, '').substring(0, 12).toUpperCase();
    return `ADR-${year}-${uuid}`;
  }

  // Cleanup expired OTPs (can be called by a cron job)
  async cleanupExpiredOTPs(): Promise<void> {
    await this.otpRepository.delete({
      expires_at: LessThan(new Date()),
    });
  }
}
