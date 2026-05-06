import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Request,
  Response,
  Post,
  UseGuards,
  Patch,
  Delete,
  SerializeOptions,
  Header,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthForgotPasswordDto } from './dto/auth-forgot-password.dto';
import { AuthConfirmEmailDto } from './dto/auth-confirm-email.dto';
import { AuthResetPasswordDto } from './dto/auth-reset-password.dto';
import { AuthUpdateDto } from './dto/auth-update.dto';
import { AuthVerifyOtpDto } from './dto/auth-verify-otp.dto';
import { AuthResetPasswordWithOtpDto } from './dto/auth-reset-password-with-otp.dto';
import { AuthGuard } from '@nestjs/passport';
import { AuthRegisterLoginDto } from './dto/auth-register-login.dto';
import { AuthRequestEmailChangeDto } from './dto/auth-request-email-change.dto';
import { AuthConfirmEmailChangeDto } from './dto/auth-confirm-email-change.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { NullableType } from '@/utils/types/nullable.type';
import { User } from '@/users/domain/user';
import { RefreshResponseDto } from './dto/refresh-response.dto';
import { AuthUserIdLoginDto } from './dto/auth-userid-login.dto';
import { AuthMeResponseDto } from '@/auth/dto/auth-me.dto';
import { FacebookMockService } from './strategies/facebook-mock.strategy';
import { GoogleMockService } from './strategies/google-mock.strategy';
import { FirebaseAuthService } from './strategies/firebase-auth.service';
import { AuthFirebaseLoginDto } from './dto/auth-firebase-login.dto';
import { DevOnlyGuard } from '@/utils/guards/dev-only.guard';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '@/config/config.type';
import {
  GoogleOAuthGuard,
  FacebookOAuthGuard,
} from './guards/oauth-cancel.guard';

@ApiTags('Auth')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(
    private readonly service: AuthService,
    private readonly facebookMockService: FacebookMockService,
    private readonly googleMockService: GoogleMockService,
    private readonly firebaseAuthService: FirebaseAuthService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  @SerializeOptions({
    groups: ['me'],
  })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('email/login')
  @ApiOkResponse({
    type: LoginResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  public login(@Body() loginDto: AuthEmailLoginDto): Promise<LoginResponseDto> {
    return this.service.validateLogin(loginDto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('email/register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Register new user',
    description:
      'Registers a new user with CANCELLED status and sends an email with both a 6-digit OTP code and a confirmation link. User can confirm their email using either method via /auth/email/confirm/otp or /auth/email/confirm endpoints. When a referral code is provided and uses user_selection mode, response includes selection_pending=true and referral_code_usage_id.',
  })
  async register(
    @Body() createUserDto: AuthRegisterLoginDto,
  ): Promise<{ selection_pending: boolean; referral_code_usage_id?: number }> {
    return this.service.register(createUserDto);
  }

  @Post('email/confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Confirm email using hash from email link',
    description:
      'Confirms user email and activates account using the hash token from the email link',
  })
  async confirmEmail(
    @Body() confirmEmailDto: AuthConfirmEmailDto,
  ): Promise<void> {
    return this.service.confirmEmail(confirmEmailDto.hash);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('email/confirm/otp')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Confirm email using OTP code',
    description:
      'Confirms user email and activates account using the OTP code sent during registration. Alternative to clicking the email link.',
  })
  async confirmEmailWithOtp(
    @Body() verifyOtpDto: AuthVerifyOtpDto,
  ): Promise<void> {
    return this.service.confirmEmailWithOtp(
      verifyOtpDto.email,
      verifyOtpDto.otp,
    );
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('email/confirm/resend-otp')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Resend confirmation OTP',
    description:
      'Generates and sends a new OTP code for email confirmation. Previous OTPs for this user are invalidated. Only works for unconfirmed accounts.',
  })
  async resendConfirmationOtp(
    @Body() resendOtpDto: AuthForgotPasswordDto,
  ): Promise<void> {
    return this.service.resendConfirmationOtp(resendOtpDto.email);
  }

  @Post('email/confirm/new')
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmNewEmail(
    @Body() confirmEmailDto: AuthConfirmEmailDto,
  ): Promise<void> {
    return this.service.confirmNewEmail(confirmEmailDto.hash);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('forgot/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Request password reset',
    description:
      'Sends both a reset link and a 6-digit OTP code to the user email. User can choose to reset via email link or by entering the OTP on the verify-otp page.',
  })
  async forgotPassword(
    @Body() forgotPasswordDto: AuthForgotPasswordDto,
  ): Promise<void> {
    return this.service.forgotPassword(forgotPasswordDto.email);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('reset/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Reset password using hash from email link',
    description:
      'Resets user password using the hash token from the email link',
  })
  resetPassword(@Body() resetPasswordDto: AuthResetPasswordDto): Promise<void> {
    return this.service.resetPassword(
      resetPasswordDto.hash,
      resetPasswordDto.password,
      resetPasswordDto.passwordConfirmation,
    );
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('verify/otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify OTP code',
    description:
      'Verifies the OTP code and returns a hash for password reset. The OTP is atomically marked as used after verification to prevent concurrent reuse. Use the returned hash with /reset/password endpoint within 5 minutes.',
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean', example: true },
        hash: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description:
            'JWT hash to use with /reset/password endpoint (valid for 5 minutes)',
        },
      },
    },
  })
  async verifyOtp(
    @Body() verifyOtpDto: AuthVerifyOtpDto,
  ): Promise<{ valid: boolean; hash: string }> {
    return this.service.verifyOtp(verifyOtpDto.email, verifyOtpDto.otp);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('reset/password/otp')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Reset password using OTP (direct method)',
    description:
      'Directly resets user password using an unused OTP code. For better security, use /verify/otp first to get a hash, then use /reset/password. OTPs can only be used once and are atomically marked as consumed.',
  })
  async resetPasswordWithOtp(
    @Body() resetPasswordDto: AuthResetPasswordWithOtpDto,
  ): Promise<void> {
    return this.service.resetPasswordWithOtp(
      resetPasswordDto.email,
      resetPasswordDto.otp,
      resetPasswordDto.password,
      resetPasswordDto.passwordConfirmation,
    );
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('resend/otp')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Resend OTP code',
    description:
      'Generates and sends a new OTP code to the user email. Previous OTPs for this user are invalidated.',
  })
  async resendOtp(@Body() resendOtpDto: AuthForgotPasswordDto): Promise<void> {
    return this.service.resendOtp(resendOtpDto.email);
  }

  @ApiBearerAuth()
  @Post('email/change/request')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Request email change',
    description:
      'Initiates email change for logged-in user. Sends a 6-digit OTP to the new email address for verification. User must be authenticated.',
  })
  async requestEmailChange(
    @Request() request,
    @Body() dto: AuthRequestEmailChangeDto,
  ): Promise<void> {
    return this.service.requestEmailChange(request.user.id, dto.newEmail);
  }

  @ApiBearerAuth()
  @Post('email/change/confirm')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm email change with OTP',
    description:
      'Confirms email change using the OTP sent to the new email address. Updates the user email upon successful verification.',
  })
  async confirmEmailChange(
    @Request() request,
    @Body() dto: AuthConfirmEmailChangeDto,
  ): Promise<{ message: string }> {
    await this.service.confirmEmailChangeWithOtp(request.user.id, dto.otp);
    return { message: 'Email updated successfully' };
  }

  @ApiBearerAuth()
  @Post('email/change/resend-otp')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Resend email change OTP',
    description:
      'Generates and sends a new OTP code for email change verification. Previous OTPs for this user are invalidated. Requires an active email change request.',
  })
  async resendEmailChangeOtp(@Request() request): Promise<void> {
    return this.service.resendEmailChangeOtp(request.user.id);
  }

  @ApiBearerAuth()
  @SerializeOptions({
    groups: ['me'],
  })
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @ApiOkResponse({
    type: AuthMeResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  public me(@Request() request): Promise<AuthMeResponseDto> {
    return this.service.me(request.user);
  }

  @ApiBearerAuth()
  @ApiOkResponse({
    type: RefreshResponseDto,
  })
  @SerializeOptions({
    groups: ['me'],
  })
  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  @HttpCode(HttpStatus.OK)
  public refresh(@Request() request): Promise<RefreshResponseDto> {
    return this.service.refreshToken({
      sessionId: request.user.sessionId,
      hash: request.user.hash,
    });
  }

  @ApiBearerAuth()
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  public async logout(@Request() request): Promise<void> {
    await this.service.logout({
      sessionId: request.user.sessionId,
    });
  }

  @ApiBearerAuth()
  @SerializeOptions({
    groups: ['me'],
  })
  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: User,
  })
  public update(
    @Request() request,
    @Body() userDto: AuthUpdateDto,
  ): Promise<NullableType<User>> {
    return this.service.update(request.user, userDto);
  }

  @ApiBearerAuth()
  @Delete('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  public async delete(@Request() request): Promise<void> {
    return this.service.softDelete(request.user);
  }

  @SerializeOptions({
    groups: ['me'],
  })
  @Post('user_id/login')
  @ApiOkResponse({
    type: LoginResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  public driverLogin(
    @Body() loginDto: AuthUserIdLoginDto,
  ): Promise<LoginResponseDto> {
    return this.service.validateUserIdLogin(loginDto);
  }

  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  @HttpCode(HttpStatus.OK)
  facebookAuth() {
    // This route initiates the Facebook OAuth flow
    // The actual redirect is handled by Passport
  }

  @Get('facebook/callback')
  @UseGuards(FacebookOAuthGuard)
  @HttpCode(HttpStatus.OK)
  async facebookAuthCallback(@Request() req, @Response() res): Promise<void> {
    if (!req.user) return;
    const data = await this.service.validateOAuthLogin(req.user);
    const frontendUrl = this.configService.get('app.frontendDomain', {
      infer: true,
    });
    const params = new URLSearchParams({
      token: data.token,
      refreshToken: data.refreshToken,
      tokenExpires: String(data.tokenExpires),
    });
    res.redirect(`${frontendUrl}/en/auth/callback?${params.toString()}`);
  }

  /**
   * Mock Facebook OAuth endpoint for local development
   *
   * This endpoint bypasses the real Facebook OAuth flow and allows you to test
   * the entire authentication flow locally without needing Facebook credentials.
   *
   * ⚠️ ONLY AVAILABLE IN DEVELOPMENT - Blocked in production by DevOnlyGuard
   *
   * @example
   * GET /auth/facebook/mock
   * GET /auth/facebook/mock?email=john@example.com&firstName=John&lastName=Doe
   * GET /auth/facebook/mock?scenario=new
   * GET /auth/facebook/mock?scenario=existing
   * GET /auth/facebook/mock?scenario=admin     // Creates system admin (system_admin = true)
   * GET /auth/facebook/mock?scenario=regular   // Creates regular user (system_admin = false)
   */
  @SerializeOptions({
    groups: ['me'],
  })
  @Get('facebook/mock')
  @UseGuards(DevOnlyGuard)
  @ApiOperation({
    summary: 'Mock Facebook OAuth Login (Development Only)',
    description:
      'Simulates Facebook OAuth flow for testing without real Facebook credentials. Only available in development/test environments.',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    description: 'Email for the mock user',
    example: 'john.doe@example.com',
  })
  @ApiQuery({
    name: 'firstName',
    required: false,
    description: 'First name for the mock user',
    example: 'John',
  })
  @ApiQuery({
    name: 'lastName',
    required: false,
    description: 'Last name for the mock user',
    example: 'Doe',
  })
  @ApiQuery({
    name: 'scenario',
    required: false,
    enum: ['new', 'existing', 'admin', 'regular'],
    description:
      'Use a predefined test scenario instead of custom parameters. "admin" = system_admin true, "regular" = system_admin false',
    example: 'new',
  })
  @ApiOkResponse({
    type: LoginResponseDto,
    description: 'Successfully authenticated with mock Facebook profile',
  })
  @HttpCode(HttpStatus.OK)
  async facebookMockAuth(@Request() req, @Response() res): Promise<void> {
    let mockProfile;

    if (req.query.scenario) {
      mockProfile = this.facebookMockService.getTestUser(
        req.query.scenario as 'new' | 'existing' | 'admin' | 'regular',
      );
    } else {
      mockProfile = this.facebookMockService.generateMockProfile(req.query);
    }

    const data = await this.service.validateOAuthLogin(mockProfile);
    const frontendUrl = this.configService.get('app.frontendDomain', {
      infer: true,
    });
    const params = new URLSearchParams({
      token: data.token,
      refreshToken: data.refreshToken,
      tokenExpires: String(data.tokenExpires),
    });
    res.redirect(`${frontendUrl}/en/auth/callback?${params.toString()}`);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @HttpCode(HttpStatus.OK)
  googleAuth() {
    // Passport handles the redirect to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  @HttpCode(HttpStatus.OK)
  async googleAuthCallback(@Request() req, @Response() res): Promise<void> {
    if (!req.user) return;
    const data = await this.service.validateOAuthLogin(req.user);
    const frontendUrl = this.configService.get('app.frontendDomain', {
      infer: true,
    });
    const params = new URLSearchParams({
      token: data.token,
      refreshToken: data.refreshToken,
      tokenExpires: String(data.tokenExpires),
    });
    res.redirect(`${frontendUrl}/en/auth/callback?${params.toString()}`);
  }

  @SerializeOptions({ groups: ['me'] })
  @Get('google/mock')
  @UseGuards(DevOnlyGuard)
  @ApiOperation({
    summary: 'Mock Google OAuth Login (Development Only)',
    description:
      'Simulates Google OAuth flow for testing without real Google credentials. Only available in development/test environments.',
  })
  @ApiQuery({ name: 'email', required: false })
  @ApiQuery({ name: 'firstName', required: false })
  @ApiQuery({ name: 'lastName', required: false })
  @ApiQuery({
    name: 'scenario',
    required: false,
    enum: ['new', 'existing', 'admin', 'regular'],
  })
  @HttpCode(HttpStatus.OK)
  async googleMockAuth(@Request() req, @Response() res): Promise<void> {
    let mockProfile;

    if (req.query.scenario) {
      mockProfile = this.googleMockService.getTestUser(
        req.query.scenario as 'new' | 'existing' | 'admin' | 'regular',
      );
    } else {
      mockProfile = this.googleMockService.generateMockProfile(req.query);
    }

    const data = await this.service.validateOAuthLogin(mockProfile);
    const frontendUrl = this.configService.get('app.frontendDomain', {
      infer: true,
    });
    const params = new URLSearchParams({
      token: data.token,
      refreshToken: data.refreshToken,
      tokenExpires: String(data.tokenExpires),
    });
    res.redirect(`${frontendUrl}/en/auth/callback?${params.toString()}`);
  }

  @SerializeOptions({ groups: ['me'] })
  @Post('firebase/login')
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiOperation({
    summary: 'Sign in with Firebase ID token (mobile only)',
    description:
      'Verifies a Firebase ID token from mobile clients. ' +
      'Only accepts google.com and facebook.com as sign-in providers.',
  })
  @HttpCode(HttpStatus.OK)
  async firebaseLogin(
    @Body() dto: AuthFirebaseLoginDto,
  ): Promise<LoginResponseDto> {
    const profile = await this.firebaseAuthService.verifyIdToken(dto.idToken);
    return this.service.validateOAuthLogin(profile);
  }
}
