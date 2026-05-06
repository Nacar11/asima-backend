import axios from 'axios';
import { UpdateUserDto } from '@/users/dto/update-user.dto';
import { StatusEnum } from '@/users/users.enum';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import ms from 'ms';
import crypto from 'crypto';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthUpdateDto } from './dto/auth-update.dto';
import { AuthRegisterLoginDto } from './dto/auth-register-login.dto';
import { NullableType } from '@/utils/types/nullable.type';
import { LoginResponseDto } from './dto/login-response.dto';
import { AuthMeResponseDto } from './dto/auth-me.dto';
import { ConfigService } from '@nestjs/config';
import { JwtRefreshPayloadType } from './strategies/types/jwt-refresh-payload.type';
import { JwtPayloadType } from './strategies/types/jwt-payload.type';
import { UsersService } from '@/users/users.service';
import { AllConfigType } from '@/config/config.type';
import { MailService } from '@/mail/mail.service';
import { Session } from '@/session/domain/session';
import { SessionService } from '@/session/session.service';
import { User } from '@/users/domain/user';
import { AuthUserIdLoginDto } from './dto/auth-userid-login.dto';
import { UserAssignmentsService } from '../user-assignments/user-assignments.service';
import { UserPermissionsService } from '../user-permissions/user-permissions.service';
import { SocialAccountRepository } from '@/social-accounts/persistence/repositories/social-account.repository';
import { FacebookProfile } from './strategies/facebook.strategy';
import { PasswordResetTokenRepository } from '@/password-reset-tokens/persistence/repositories/password-reset-token.repository';
import { UserDetailsService } from '@/user-details/user-details.service';
import { ApplicationLoggerService } from '@/loggers/services/application.logger.service';
import { BaseSellerRepository } from '@/sellers/persistence/base-seller.repository';
import { StorageService } from '@/storage/storage.service';
import { BaseShoppingCartRepository } from '@/shopping-carts/persistence/base-shopping-cart.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSellerAssignmentEntity } from '@/user-seller-assignments/persistence/entities/user-seller-assignment.entity';
import { ReferralCodesService } from '@/referral-codes/referral-codes.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private userAssignmentsService: UserAssignmentsService,
    private userPermissionsService: UserPermissionsService,
    private sessionService: SessionService,
    private mailService: MailService,
    private configService: ConfigService<AllConfigType>,
    private socialAccountRepository: SocialAccountRepository,
    private passwordResetTokenRepository: PasswordResetTokenRepository,
    private userDetailsService: UserDetailsService,
    private applicationLoggerService: ApplicationLoggerService,
    private sellerRepository: BaseSellerRepository,
    private storageService: StorageService,
    private cartRepository: BaseShoppingCartRepository,
    @InjectRepository(UserSellerAssignmentEntity)
    private userSellerAssignmentRepository: Repository<UserSellerAssignmentEntity>,
    private referralCodesService: ReferralCodesService,
  ) {}

  async validateLogin(loginDto: AuthEmailLoginDto): Promise<LoginResponseDto> {
    const user = await this.usersService.findByEmailWithCredentials(
      loginDto.email,
    );

    if (!user || user.deleted_at !== null) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'notFound',
        },
      });
    }

    if (!user.password) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          password: 'incorrectPassword',
        },
      });
    }

    const isValidPassword = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isValidPassword) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          password: 'incorrectPassword',
        },
      });
    }

    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    const session = await this.sessionService.create({
      user,
      hash,
    });

    const storeContext = await this.determineStoreContext(user.id);
    await this.populateMemberSeller(user, storeContext);
    user.seller_id = storeContext.seller_id;
    user.is_store_owner = storeContext.is_store_owner;

    const { token, refreshToken, tokenExpires } = await this.getTokensData({
      id: user.id,
      system_admin: user.system_admin,
      sessionId: session.id,
      hash,
      seller_id: storeContext.seller_id,
      is_store_owner: storeContext.is_store_owner,
    });

    const [userAssignments, userPermissions, cart] = await Promise.all([
      this.userAssignmentsService.getUserGroupsFromAssignments(
        Number(user?.id),
      ),
      this.userPermissionsService.getUserPermissions(Number(user?.id)),
      this.cartRepository.findByUserId(user.id, false),
    ]);

    return {
      refreshToken,
      token,
      tokenExpires,
      cart_id: cart?.id ?? null,
      user,
      user_assignments: userAssignments,
      user_permissions: userPermissions,
    };
  }

  async register(
    dto: AuthRegisterLoginDto,
  ): Promise<{ selection_pending: boolean; referral_code_usage_id?: number }> {
    if (dto.password !== dto.confirm_password) {
      throw new BadRequestException(
        'Password and confirm password do not match.',
      );
    }

    // Validate referral code before user creation — fail fast per spec.
    if (dto.referral_code) {
      const validation = await this.referralCodesService.validateCode(
        dto.referral_code,
      );
      if (!validation.is_valid) {
        throw new UnprocessableEntityException('Invalid or expired referral code');
      }
    }

    const createUserDto = { ...dto };
    delete (createUserDto as { confirm_password?: string }).confirm_password;

    // UsersService.create handles phone/address via UserDetailsService
    const user = await this.usersService.create({
      ...createUserDto,
      email: dto.email,
      status: StatusEnum.CANCELLED,
    });

    const tokenExpiresIn = this.configService.getOrThrow(
      'auth.confirmEmailExpires',
      {
        infer: true,
      },
    );

    const tokenExpires = Date.now() + ms(tokenExpiresIn);
    const expiresAt = new Date(tokenExpires);

    // Generate JWT hash for email link
    const hash = await this.jwtService.signAsync(
      {
        confirmEmailUserId: user.id,
      },
      {
        secret: this.configService.getOrThrow('auth.confirmEmailSecret', {
          infer: true,
        }),
        expiresIn: tokenExpiresIn,
      },
    );

    // Generate OTP for manual entry
    const otp = this.generateOtp();
    const token = crypto.randomBytes(32).toString('hex');

    // Save OTP to database
    await this.passwordResetTokenRepository.create({
      user_id: user.id,
      token,
      otp,
      expires_at: expiresAt,
    });

    // Send email with both OTP and hash link
    await this.mailService.userSignUp({
      to: dto.email,
      data: {
        hash,
        otp,
        tokenExpires,
      },
    });

    // Apply referral code after user creation (separate transaction per plan note).
    if (dto.referral_code) {
      const result = await this.referralCodesService.applyReferralCode(
        dto.referral_code,
        user,
      );
      return {
        selection_pending: result.selectionPending,
        referral_code_usage_id: result.usageId,
      };
    }

    return { selection_pending: false };
  }

  async confirmEmail(hash: string): Promise<void> {
    let user_id: User['id'];

    try {
      const jwtData = await this.jwtService.verifyAsync<{
        confirmEmailUserId: User['id'];
      }>(hash, {
        secret: this.configService.getOrThrow('auth.confirmEmailSecret', {
          infer: true,
        }),
      });

      user_id = jwtData.confirmEmailUserId;
    } catch {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          hash: `invalidHash`,
        },
      });
    }

    const user = await this.usersService.findById(user_id);

    if (!user || user?.status != StatusEnum.CANCELLED) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        error: `notFound`,
      });
    }

    const updateUserDto = {
      status: StatusEnum.ACTIVE,
    } as UpdateUserDto;

    await this.usersService.update(user.id, updateUserDto);

    // Delete all registration tokens for this user
    await this.passwordResetTokenRepository.deleteByUserId(user.id);
  }

  /**
   * Confirm email using OTP code
   * Alternative to clicking the email link
   */
  async confirmEmailWithOtp(email: string, otp: string): Promise<void> {
    // Use shared OTP verification logic
    const user = await this.verifyOtpForUser(email, otp);

    // Additional validation: user must be in CANCELLED status
    if (user.status !== StatusEnum.CANCELLED) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'alreadyConfirmed',
        },
      });
    }

    // Activate the user account
    const updateUserDto = {
      status: StatusEnum.ACTIVE,
    } as UpdateUserDto;

    await this.usersService.update(user.id, updateUserDto);

    // Delete all registration tokens for this user
    await this.passwordResetTokenRepository.deleteByUserId(user.id);
  }

  /**
   * Resend OTP for email confirmation
   * Only works for unconfirmed accounts (CANCELLED status)
   * Invalidates all previous OTPs and generates a new one
   * Enforces 60-second cooldown between resend requests
   */
  async resendConfirmationOtp(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'emailNotExists',
        },
      });
    }

    // Check if user is in CANCELLED status (not yet confirmed)
    if (user.status !== StatusEnum.CANCELLED) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'alreadyConfirmed',
        },
      });
    }

    // Check if user has any existing confirmation tokens
    const existingTokens = await this.passwordResetTokenRepository.findByUserId(
      user.id,
    );

    if (existingTokens.length === 0) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'noActiveConfirmationRequest',
        },
      });
    }

    // Check cooldown period (60 seconds)
    // Find the most recently created token
    const mostRecentToken = existingTokens.reduce((latest, token) => {
      if (!latest || new Date(token.created_at) > new Date(latest.created_at)) {
        return token;
      }
      return latest;
    }, existingTokens[0]);

    if (mostRecentToken) {
      const timeSinceLastOtp =
        Date.now() - new Date(mostRecentToken.created_at).getTime();
      const cooldownPeriod = 60 * 1000; // 60 seconds in milliseconds

      if (timeSinceLastOtp < cooldownPeriod) {
        const secondsRemaining = Math.ceil(
          (cooldownPeriod - timeSinceLastOtp) / 1000,
        );
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: `pleaseWait${secondsRemaining}Seconds`,
          },
        });
      }
    }

    // Delete all existing confirmation tokens for this user
    await this.passwordResetTokenRepository.deleteByUserId(user.id);

    const tokenExpiresIn = this.configService.getOrThrow(
      'auth.confirmEmailExpires',
      {
        infer: true,
      },
    );

    const tokenExpires = Date.now() + ms(tokenExpiresIn);
    const expiresAt = new Date(tokenExpires);

    // Generate new OTP
    const otp = this.generateOtp();
    const token = crypto.randomBytes(32).toString('hex');

    // Save new OTP to database
    await this.passwordResetTokenRepository.create({
      user_id: user.id,
      token,
      otp,
      expires_at: expiresAt,
    });

    // Send email with new OTP
    await this.mailService.resendConfirmationOtp({
      to: email,
      data: {
        otp,
        tokenExpires,
      },
    });
  }

  async confirmNewEmail(hash: string): Promise<void> {
    let user_id: User['id'];
    let newEmail: User['email'];

    try {
      const jwtData = await this.jwtService.verifyAsync<{
        confirmEmailUserId: User['id'];
        newEmail: User['email'];
      }>(hash, {
        secret: this.configService.getOrThrow('auth.confirmEmailSecret', {
          infer: true,
        }),
      });

      user_id = jwtData.confirmEmailUserId;
      newEmail = jwtData.newEmail;
    } catch {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          hash: `invalidHash`,
        },
      });
    }

    const user = await this.usersService.findById(user_id);

    if (!user) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        error: `notFound`,
      });
    }

    const updateUserDto = {
      email: newEmail,
      status: StatusEnum.ACTIVE,
    } as UpdateUserDto;

    await this.usersService.update(user.id, updateUserDto);
  }

  /**
   * Request email change for logged-in user
   * Sends OTP to the new email address for verification
   */
  async requestEmailChange(
    userId: User['id'],
    newEmail: string,
  ): Promise<void> {
    const currentUser = await this.usersService.findById(userId);

    if (!currentUser) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          user: 'userNotFound',
        },
      });
    }

    // Check if new email is same as current
    if (currentUser.email === newEmail) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'sameAsCurrent',
        },
      });
    }

    // Check if new email already exists
    const existingUser = await this.usersService.findByEmail(newEmail);
    if (existingUser && existingUser.id !== userId) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'emailExists',
        },
      });
    }

    // Check cooldown - look for recent email change tokens
    const existingTokens =
      await this.passwordResetTokenRepository.findByUserId(userId);

    // Filter for email change tokens (they have new_email field in metadata)
    const emailChangeTokens = existingTokens.filter(
      (token) => token.metadata?.type === 'email_change',
    );

    if (emailChangeTokens.length > 0) {
      const mostRecentToken = emailChangeTokens.reduce((latest, token) => {
        if (
          !latest ||
          new Date(token.created_at) > new Date(latest.created_at)
        ) {
          return token;
        }
        return latest;
      }, emailChangeTokens[0]);

      const timeSinceLastOtp =
        Date.now() - new Date(mostRecentToken.created_at).getTime();
      const cooldownPeriod = 60 * 1000; // 60 seconds

      if (timeSinceLastOtp < cooldownPeriod) {
        const secondsRemaining = Math.ceil(
          (cooldownPeriod - timeSinceLastOtp) / 1000,
        );
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: `pleaseWait${secondsRemaining}Seconds`,
          },
        });
      }

      // Delete old email change tokens (batch delete for efficiency)
      await this.passwordResetTokenRepository.deleteEmailChangeTokensByUserId(
        userId,
      );
    }

    const tokenExpiresIn = this.configService.getOrThrow(
      'auth.confirmEmailExpires',
      {
        infer: true,
      },
    );

    const tokenExpires = Date.now() + ms(tokenExpiresIn);
    const expiresAt = new Date(tokenExpires);

    // Generate OTP
    const otp = this.generateOtp();
    const token = crypto.randomBytes(32).toString('hex');

    // Save OTP to database with metadata indicating email change
    await this.passwordResetTokenRepository.create({
      user_id: userId,
      token,
      otp,
      expires_at: expiresAt,
      metadata: {
        type: 'email_change',
        new_email: newEmail,
      },
    });

    // Send OTP to the new email address
    await this.mailService.sendEmailChangeOtp({
      to: newEmail,
      data: {
        otp,
        newEmail,
        tokenExpires,
      },
    });
  }

  /**
   * Confirm email change using OTP
   * Verifies OTP and updates user email
   */
  async confirmEmailChangeWithOtp(
    userId: User['id'],
    otp: string,
  ): Promise<void> {
    const currentUser = await this.usersService.findById(userId);

    if (!currentUser) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          user: 'userNotFound',
        },
      });
    }

    // Verify user account is active
    if (currentUser.status !== StatusEnum.ACTIVE) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          user: 'accountNotActive',
        },
      });
    }

    // Find valid OTP for email change
    const resetToken =
      await this.passwordResetTokenRepository.findValidOtp(otp);

    if (
      !resetToken ||
      resetToken.user_id !== userId ||
      resetToken.metadata?.type !== 'email_change'
    ) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          otp: 'invalidOrExpired',
        },
      });
    }

    const newEmail = resetToken.metadata?.new_email;

    if (!newEmail) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          otp: 'missingEmailChangeMetadata',
        },
      });
    }

    // Double-check email doesn't exist (race condition protection)
    const existingUser = await this.usersService.findByEmail(newEmail);
    if (existingUser && existingUser.id !== userId) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'emailExists',
        },
      });
    }

    // Atomically mark OTP as used
    const wasMarked =
      await this.passwordResetTokenRepository.markAsUsedIfUnused(resetToken.id);

    if (!wasMarked) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          otp: 'invalidOrExpired',
        },
      });
    }

    // Update user email
    const updateUserDto = {
      email: newEmail,
    } as UpdateUserDto;

    await this.usersService.update(userId, updateUserDto);

    // Log email change for audit trail
    this.applicationLoggerService.logUserActivity(
      'Email address changed',
      userId,
      {
        oldEmail: currentUser.email,
        newEmail: newEmail,
        action: 'email_change',
      },
    );

    // Delete all email change tokens for this user (batch delete for efficiency)
    await this.passwordResetTokenRepository.deleteEmailChangeTokensByUserId(
      userId,
    );
  }

  /**
   * Resend OTP for email change
   * Requires that user has previously requested email change
   * Invalidates all previous OTPs and generates a new one
   * Enforces 60-second cooldown between resend requests
   */
  async resendEmailChangeOtp(userId: User['id']): Promise<void> {
    const currentUser = await this.usersService.findById(userId);

    if (!currentUser) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          user: 'userNotFound',
        },
      });
    }

    // Verify user account is active
    if (currentUser.status !== StatusEnum.ACTIVE) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          user: 'accountNotActive',
        },
      });
    }

    // Check if user has any existing email change tokens
    const existingTokens =
      await this.passwordResetTokenRepository.findByUserId(userId);

    // Filter for email change tokens
    const emailChangeTokens = existingTokens.filter(
      (token) => token.metadata?.type === 'email_change',
    );

    if (emailChangeTokens.length === 0) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'noActiveEmailChangeRequest',
        },
      });
    }

    // Check cooldown period (60 seconds)
    // Find the most recently created email change token
    const mostRecentToken = emailChangeTokens.reduce((latest, token) => {
      if (!latest || new Date(token.created_at) > new Date(latest.created_at)) {
        return token;
      }
      return latest;
    }, emailChangeTokens[0]);

    if (mostRecentToken) {
      const timeSinceLastOtp =
        Date.now() - new Date(mostRecentToken.created_at).getTime();
      const cooldownPeriod = 60 * 1000; // 60 seconds in milliseconds

      if (timeSinceLastOtp < cooldownPeriod) {
        const secondsRemaining = Math.ceil(
          (cooldownPeriod - timeSinceLastOtp) / 1000,
        );
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: `pleaseWait${secondsRemaining}Seconds`,
          },
        });
      }
    }

    // Get the new email from the most recent token metadata BEFORE deleting tokens
    const newEmail = mostRecentToken.metadata?.new_email;

    if (!newEmail) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'noActiveEmailChangeRequest',
        },
      });
    }

    // Recheck email uniqueness (another user might have registered with this email since initial request)
    const existingUser = await this.usersService.findByEmail(newEmail);
    if (existingUser && existingUser.id !== userId) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'emailExists',
        },
      });
    }

    // Delete all existing email change tokens for this user (batch delete for efficiency)
    await this.passwordResetTokenRepository.deleteEmailChangeTokensByUserId(
      userId,
    );

    const tokenExpiresIn = this.configService.getOrThrow(
      'auth.confirmEmailExpires',
      {
        infer: true,
      },
    );

    const tokenExpires = Date.now() + ms(tokenExpiresIn);
    const expiresAt = new Date(tokenExpires);

    // Generate new OTP
    const otp = this.generateOtp();
    const token = crypto.randomBytes(32).toString('hex');

    // Save new OTP to database with metadata indicating email change
    await this.passwordResetTokenRepository.create({
      user_id: userId,
      token,
      otp,
      expires_at: expiresAt,
      metadata: {
        type: 'email_change',
        new_email: newEmail,
      },
    });

    // Send email with new OTP
    await this.mailService.resendEmailChangeOtp({
      to: newEmail,
      data: {
        otp,
        tokenExpires,
      },
    });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'emailNotExists',
        },
      });
    }

    const tokenExpiresIn = this.configService.getOrThrow('auth.forgotExpires', {
      infer: true,
    });

    const tokenExpires = Date.now() + ms(tokenExpiresIn);
    const expiresAt = new Date(tokenExpires);

    // Generate JWT hash for email link
    const hash = await this.jwtService.signAsync(
      {
        forgotUserId: user.id,
      },
      {
        secret: this.configService.getOrThrow('auth.forgotSecret', {
          infer: true,
        }),
        expiresIn: tokenExpiresIn,
      },
    );

    // Generate OTP for manual entry
    const otp = this.generateOtp();
    const token = crypto.randomBytes(32).toString('hex');

    // Save OTP to database
    await this.passwordResetTokenRepository.create({
      user_id: user.id,
      token,
      otp,
      expires_at: expiresAt,
    });

    // Send email with both OTP and hash link
    await this.mailService.forgotPassword({
      to: email,
      data: {
        hash,
        otp,
        tokenExpires,
      },
    });
  }

  async resetPassword(
    hash: string,
    password: string,
    passwordConfirmation: string,
  ): Promise<void> {
    // Validate password confirmation
    if (password !== passwordConfirmation) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          passwordConfirmation: 'passwordsDoNotMatch',
        },
      });
    }

    let user_id: User['id'];
    let fromOtpVerification = false;

    try {
      const jwtData = await this.jwtService.verifyAsync<{
        forgotUserId: User['id'];
        fromOtpVerification?: boolean;
      }>(hash, {
        secret: this.configService.getOrThrow('auth.forgotSecret', {
          infer: true,
        }),
      });

      user_id = jwtData.forgotUserId;
      fromOtpVerification = jwtData.fromOtpVerification || false;
    } catch {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          hash: `invalidHash`,
        },
      });
    }

    const user = await this.usersService.findById(user_id);

    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          hash: `notFound`,
        },
      });
    }

    // Get all reset tokens for this user
    const existingTokens = await this.passwordResetTokenRepository.findByUserId(
      user.id,
    );

    const reuseError = new UnprocessableEntityException({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      errors: {
        hash: 'alreadyUsed',
      },
    });

    // If no tokens exist, the hash was already used and tokens were deleted
    if (existingTokens.length === 0) {
      throw reuseError;
    }

    if (!fromOtpVerification) {
      // For email link flow: must have at least one unused token
      const unusedToken = existingTokens.find((token) => !token.used_at);

      if (!unusedToken) {
        throw reuseError;
      }

      // Atomically mark as used to prevent race conditions
      const wasMarked =
        await this.passwordResetTokenRepository.markAsUsedIfUnused(
          unusedToken.id,
        );

      if (!wasMarked) {
        // Another request beat us to it - concurrent reset attempt
        throw reuseError;
      }
    }

    // Delete all user sessions
    await this.sessionService.deleteByUserId({
      user_id: user.id,
    });

    // Update the user's password
    const updateUserDto = {
      password,
      must_change_password: false,
    } as UpdateUserDto;

    await this.usersService.update(user.id, updateUserDto);

    // Delete all tokens for this user to prevent reuse
    await this.passwordResetTokenRepository.deleteByUserId(user.id);
  }

  /**
   * Generate a 6-digit OTP code using cryptographically secure random number generation
   */
  private generateOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Shared OTP verification logic
   * Verifies OTP belongs to user and marks it as used
   * Returns the user if verification succeeds
   */
  private async verifyOtpForUser(email: string, otp: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'emailNotExists',
        },
      });
    }

    // Find valid OTP
    const resetToken =
      await this.passwordResetTokenRepository.findValidOtp(otp);

    if (!resetToken || resetToken.user_id !== user.id) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          otp: 'invalidOrExpired',
        },
      });
    }

    // Atomically mark OTP as used to prevent race conditions
    const wasMarked =
      await this.passwordResetTokenRepository.markAsUsedIfUnused(resetToken.id);

    if (!wasMarked) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          otp: 'invalidOrExpired',
        },
      });
    }

    return user;
  }

  /**
   * Verify OTP and generate a hash for password reset
   * Note: OTP is marked as used after verification to prevent reuse
   * Returns a hash that can be used with /reset/password endpoint
   */
  async verifyOtp(
    email: string,
    otp: string,
  ): Promise<{ valid: boolean; hash: string }> {
    // Use shared OTP verification logic
    const user = await this.verifyOtpForUser(email, otp);

    // Generate a short-lived JWT hash for password reset (5 minutes)
    // Include a flag to indicate this hash came from OTP verification
    const hash = await this.jwtService.signAsync(
      {
        forgotUserId: user.id,
        fromOtpVerification: true, // Flag to skip "already used" check
      },
      {
        secret: this.configService.getOrThrow('auth.forgotSecret', {
          infer: true,
        }),
        expiresIn: '5m', // Short expiration since user is already on the reset page
      },
    );

    return { valid: true, hash };
  }

  /**
   * Reset password using OTP
   * Note: This endpoint can be used directly (without prior verification)
   * or after verifying OTP via /verify/otp endpoint
   */
  async resetPasswordWithOtp(
    email: string,
    otp: string,
    password: string,
    passwordConfirmation: string,
  ): Promise<void> {
    // Validate password confirmation
    if (password !== passwordConfirmation) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          passwordConfirmation: 'passwordsDoNotMatch',
        },
      });
    }

    // Use shared OTP verification logic
    const user = await this.verifyOtpForUser(email, otp);

    // Delete all user sessions
    await this.sessionService.deleteByUserId({
      user_id: user.id,
    });

    // Update password
    const updateUserDto = {
      password,
      must_change_password: false,
    } as UpdateUserDto;

    await this.usersService.update(user.id, updateUserDto);

    // Delete all tokens for this user to prevent reuse
    await this.passwordResetTokenRepository.deleteByUserId(user.id);
  }

  /**
   * Resend OTP for password reset
   * Requires that user has previously requested password reset
   * Invalidates all previous OTPs and generates a new one
   * Enforces 60-second cooldown between resend requests
   */
  async resendOtp(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'emailNotExists',
        },
      });
    }

    // Check if user has any existing password reset tokens (even expired ones)
    // This ensures they actually initiated a password reset flow
    const existingTokens = await this.passwordResetTokenRepository.findByUserId(
      user.id,
    );

    if (existingTokens.length === 0) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'noActiveResetRequest',
        },
      });
    }

    // Check cooldown period (60 seconds)
    // Find the most recently created token
    const mostRecentToken = existingTokens.reduce((latest, token) => {
      if (!latest || new Date(token.created_at) > new Date(latest.created_at)) {
        return token;
      }
      return latest;
    }, existingTokens[0]);

    if (mostRecentToken) {
      const timeSinceLastOtp =
        Date.now() - new Date(mostRecentToken.created_at).getTime();
      const cooldownPeriod = 60 * 1000; // 60 seconds in milliseconds

      if (timeSinceLastOtp < cooldownPeriod) {
        const secondsRemaining = Math.ceil(
          (cooldownPeriod - timeSinceLastOtp) / 1000,
        );
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: `pleaseWait${secondsRemaining}Seconds`,
          },
        });
      }
    }

    // Delete all existing password reset tokens for this user
    await this.passwordResetTokenRepository.deleteByUserId(user.id);

    const tokenExpiresIn = this.configService.getOrThrow('auth.forgotExpires', {
      infer: true,
    });

    const tokenExpires = Date.now() + ms(tokenExpiresIn);
    const expiresAt = new Date(tokenExpires);

    // Generate new OTP
    const otp = this.generateOtp();
    const token = crypto.randomBytes(32).toString('hex');

    // Save new OTP to database
    await this.passwordResetTokenRepository.create({
      user_id: user.id,
      token,
      otp,
      expires_at: expiresAt,
    });

    // Send email with new OTP
    await this.mailService.resendOtp({
      to: email,
      data: {
        otp,
        tokenExpires,
      },
    });
  }

  async me(userJwtPayload: JwtPayloadType): Promise<AuthMeResponseDto> {
    const user = await this.usersService.findById(userJwtPayload.id);

    if (!user || user.deleted_at !== null) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'notFound',
        },
      });
    }

    // @todo get session data
    const session = await this.sessionService.findById(
      userJwtPayload.sessionId,
    );

    if (!session) {
      throw new UnauthorizedException();
    }

    const storeContext = await this.determineStoreContext(user.id);
    await this.populateMemberSeller(user, storeContext);
    user.is_store_owner = storeContext.is_store_owner;

    const { token, refreshToken, tokenExpires } = await this.getTokensData({
      id: user.id,
      system_admin: user.system_admin,
      sessionId: userJwtPayload.sessionId,
      hash: session.hash,
      seller_id: storeContext.seller_id,
      is_store_owner: storeContext.is_store_owner,
    });

    const [userAssignments, userPermissions, cart] = await Promise.all([
      this.userAssignmentsService.getUserGroupsFromAssignments(
        Number(user?.id),
      ),
      this.userPermissionsService.getUserPermissions(Number(user?.id)),
      this.cartRepository.findByUserId(user.id, false),
    ]);

    return {
      refreshToken,
      token,
      tokenExpires,
      user,
      user_assignments: userAssignments,
      user_permissions: userPermissions,
      cart_id: cart?.id ?? null,
    };
  }

  async update(
    userJwtPayload: JwtPayloadType,
    userDto: AuthUpdateDto,
  ): Promise<NullableType<User>> {
    const currentUser = userDto.password
      ? await this.usersService.findByIdWithCredentials(userJwtPayload.id)
      : await this.usersService.findById(userJwtPayload.id);

    if (!currentUser) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          user: 'userNotFound',
        },
      });
    }

    if (userDto.password) {
      if (!userDto.oldPassword) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            oldPassword: 'missingOldPassword',
          },
        });
      }

      if (!currentUser.password) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            oldPassword: 'incorrectOldPassword',
          },
        });
      }

      const isValidOldPassword = await bcrypt.compare(
        userDto.oldPassword,
        currentUser.password,
      );

      if (!isValidOldPassword) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            oldPassword: 'incorrectOldPassword',
          },
        });
      } else {
        await this.sessionService.deleteByUserIdWithExclude({
          user_id: currentUser.id,
          excludeSessionId: userJwtPayload.sessionId,
        });
      }
    }

    if (userDto.email && userDto.email !== currentUser.email) {
      const userByEmail = await this.usersService.findByEmail(userDto.email);

      if (userByEmail && userByEmail.id !== currentUser.id) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: 'emailExists',
          },
        });
      }

      const hash = await this.jwtService.signAsync(
        {
          confirmEmailUserId: currentUser.id,
          newEmail: userDto.email,
        },
        {
          secret: this.configService.getOrThrow('auth.confirmEmailSecret', {
            infer: true,
          }),
          expiresIn: this.configService.getOrThrow('auth.confirmEmailExpires', {
            infer: true,
          }),
        },
      );

      await this.mailService.confirmNewEmail({
        to: userDto.email,
        data: {
          hash,
        },
      });
    }

    delete userDto.email;
    delete userDto.oldPassword;

    const profilePictureDto = userDto.profile_picture;
    delete userDto.profile_picture;

    const updateUserDto = {
      ...userDto,
      ...(userDto.password ? { must_change_password: false } : {}),
    } as UpdateUserDto;

    await this.usersService.update(
      userJwtPayload.id,
      updateUserDto,
      null,
      undefined,
      profilePictureDto,
    );

    return this.usersService.findById(userJwtPayload.id);
  }

  async refreshToken(
    data: Pick<JwtRefreshPayloadType, 'sessionId' | 'hash'>,
  ): Promise<Omit<LoginResponseDto, 'user'>> {
    const session = await this.sessionService.findById(data.sessionId);

    if (!session) {
      throw new UnauthorizedException();
    }

    if (session.hash !== data.hash) {
      throw new UnauthorizedException();
    }

    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    await this.sessionService.update(session.id, {
      hash,
    });

    const storeContext = await this.determineStoreContext(session.user.id);

    const { token, refreshToken, tokenExpires } = await this.getTokensData({
      id: session.user.id,
      system_admin: session.user.system_admin,
      sessionId: session.id,
      hash,
      seller_id: storeContext.seller_id,
      is_store_owner: storeContext.is_store_owner,
    });

    return {
      token,
      refreshToken,
      tokenExpires,
    };
  }

  async softDelete(user: User): Promise<void> {
    await this.usersService.remove(user.id, user);
  }

  async logout(data: Pick<JwtRefreshPayloadType, 'sessionId'>) {
    return this.sessionService.deleteById(data.sessionId);
  }

  async validateUserIdLogin(
    loginDto: AuthUserIdLoginDto,
  ): Promise<LoginResponseDto> {
    const user = await this.usersService.findByUserId(loginDto.user_id);

    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          user_id: 'notFound',
        },
      });
    }

    if (!user.device_pin) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          device_pin: 'Incorrect PIN',
        },
      });
    }

    const isValidPIN = await bcrypt.compare(
      loginDto.device_pin,
      user.device_pin,
    );

    if (!isValidPIN) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          device_pin: 'Incorrect PIN',
        },
      });
    }

    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    const session = await this.sessionService.create({
      user,
      hash,
    });

    const storeContext = await this.determineStoreContext(user.id);
    await this.populateMemberSeller(user, storeContext);

    const { token, refreshToken, tokenExpires } = await this.getTokensData({
      id: user.id,
      system_admin: user.system_admin,
      sessionId: session.id,
      hash,
      seller_id: storeContext.seller_id,
      is_store_owner: storeContext.is_store_owner,
    });

    const [userAssignments, userPermissions, cart] = await Promise.all([
      this.userAssignmentsService.getUserGroupsFromAssignments(
        Number(user?.id),
      ),
      this.userPermissionsService.getUserPermissions(Number(user?.id)),
      this.cartRepository.findByUserId(user.id, false),
    ]);

    return {
      refreshToken,
      token,
      tokenExpires,
      user,
      user_assignments: userAssignments,
      user_permissions: userPermissions,
      cart_id: cart?.id ?? null,
    };
  }

  async validateOAuthLogin(
    profile: FacebookProfile,
  ): Promise<LoginResponseDto> {
    // Try to find existing social account
    const socialAccount =
      await this.socialAccountRepository.findByProviderAndProviderId(
        profile.provider,
        profile.providerId,
      );

    let user: User | null = null;

    if (socialAccount) {
      // Social account exists, get the user
      user = await this.usersService.findById(socialAccount.user_id);

      // Update social account tokens
      await this.socialAccountRepository.update(socialAccount.id, {
        access_token: profile.accessToken,
        refresh_token: profile.refreshToken,
        profile_data: {
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          picture: profile.picture,
        },
      });
    } else {
      // Try to find user by email for account linking
      if (profile.email) {
        user = await this.usersService.findByEmail(profile.email);
      }

      // Create new user if doesn't exist
      if (!user) {
        user = await this.usersService.create({
          email: profile.email,
          first_name: profile.firstName,
          last_name: profile.lastName,
          image: null,
          status: StatusEnum.ACTIVE,
          system_admin: profile.systemAdmin ?? false, // Use profile flag for mock testing
          // No password for OAuth users
          password: randomStringGenerator(),
        });

        if (profile.picture) {
          const imageUrl = await this.uploadOAuthProfilePicture(
            profile.picture,
            user.id,
          );
          if (imageUrl) {
            await this.usersService.update(user.id, { image: imageUrl });
          }
        }
      }

      // Create social account link
      await this.socialAccountRepository.create({
        user_id: user.id,
        provider: profile.provider,
        provider_id: profile.providerId,
        access_token: profile.accessToken,
        refresh_token: profile.refreshToken,
        is_verified: true,
        profile_data: {
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          picture: profile.picture,
        },
      });
    }

    if (!user || user.deleted_at !== null) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          user: 'notFound',
        },
      });
    }

    // Create session
    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    const session = await this.sessionService.create({
      user,
      hash,
    });

    const storeContext = await this.determineStoreContext(user.id);
    await this.populateMemberSeller(user, storeContext);

    const { token, refreshToken, tokenExpires } = await this.getTokensData({
      id: user.id,
      system_admin: user.system_admin,
      sessionId: session.id,
      hash,
      seller_id: storeContext.seller_id,
      is_store_owner: storeContext.is_store_owner,
    });

    const userAssignments =
      await this.userAssignmentsService.getUserGroupsFromAssignments(
        Number(user?.id),
      );

    const userPermissions =
      await this.userPermissionsService.getUserPermissions(Number(user?.id));

    return {
      refreshToken,
      token,
      tokenExpires,
      user,
      user_assignments: userAssignments,
      user_permissions: userPermissions,
    };
  }

  private async populateMemberSeller(
    user: User,
    storeContext: { seller_id: number | null; is_store_owner: boolean | null },
  ): Promise<void> {
    user.seller_id = storeContext.seller_id;
    user.is_store_owner = storeContext.is_store_owner;

    if (storeContext.seller_id && !user.seller) {
      const seller = await this.sellerRepository.findById(
        storeContext.seller_id,
      );
      if (seller) {
        user.seller = seller;
      }
    }
  }

  private async determineStoreContext(
    userId: number,
  ): Promise<{ seller_id: number | null; is_store_owner: boolean | null }> {
    try {
      const seller = await this.sellerRepository.findByUserId(userId);

      if (seller) {
        return {
          seller_id: seller.id,
          is_store_owner: true,
        };
      }

      const storeAssignment = await this.userSellerAssignmentRepository.findOne(
        {
          where: {
            user_id: userId,
            status: 'Active' as any,
          },
        },
      );

      if (storeAssignment) {
        return {
          seller_id: storeAssignment.seller_id,
          is_store_owner: false,
        };
      }

      return {
        seller_id: null,
        is_store_owner: null,
      };
    } catch (error) {
      console.error('Error determining store context:', error);
      return {
        seller_id: null,
        is_store_owner: null,
      };
    }
  }

  private async getTokensData(data: {
    id: User['id'];
    sessionId: Session['id'];
    hash: Session['hash'];
    system_admin: User['system_admin'];
    seller_id?: number | null;
    is_store_owner?: boolean | null;
  }) {
    const tokenExpiresIn = this.configService.getOrThrow('auth.expires', {
      infer: true,
    });

    const tokenExpires = Date.now() + ms(tokenExpiresIn);

    const [token, refreshToken] = await Promise.all([
      await this.jwtService.signAsync(
        {
          id: data.id,
          system_admin: data.system_admin,
          sessionId: data.sessionId,
          seller_id: data.seller_id ?? null,
          is_store_owner: data.is_store_owner ?? null,
        },
        {
          secret: this.configService.getOrThrow('auth.secret', { infer: true }),
          expiresIn: tokenExpiresIn,
        },
      ),
      await this.jwtService.signAsync(
        {
          sessionId: data.sessionId,
          hash: data.hash,
        },
        {
          secret: this.configService.getOrThrow('auth.refreshSecret', {
            infer: true,
          }),
          expiresIn: this.configService.getOrThrow('auth.refreshExpires', {
            infer: true,
          }),
        },
      ),
    ]);

    return {
      token,
      refreshToken,
      tokenExpires,
    };
  }

  private async uploadOAuthProfilePicture(
    pictureUrl: string,
    userId: number,
  ): Promise<string | null> {
    try {
      const response = await axios.get<ArrayBuffer>(pictureUrl, {
        responseType: 'arraybuffer',
      });
      const buffer = Buffer.from(response.data);
      const contentType =
        (response.headers['content-type'] as string) || 'image/jpeg';
      const ext = contentType.includes('png') ? '.png' : '.jpg';
      const key = `users/${userId}/avatar-${Date.now()}${ext}`;
      const { url } = await this.storageService.putBuffer(
        buffer,
        key,
        contentType,
      );
      return url;
    } catch {
      return null;
    }
  }
}
