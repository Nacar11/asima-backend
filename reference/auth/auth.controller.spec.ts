import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { User } from '@/users/domain/user';
import { AuthUpdateDto } from '@/auth/dto/auth-update.dto';
import { RefreshResponseDto } from '@/auth/dto/refresh-response.dto';
import { AuthRegisterLoginDto } from '@/auth/dto/auth-register-login.dto';
import { AuthConfirmEmailDto } from '@/auth/dto/auth-confirm-email.dto';
import { AuthForgotPasswordDto } from '@/auth/dto/auth-forgot-password.dto';
import { AuthResetPasswordDto } from '@/auth/dto/auth-reset-password.dto';
import { AuthVerifyOtpDto } from '@/auth/dto/auth-verify-otp.dto';
import { AuthResetPasswordWithOtpDto } from '@/auth/dto/auth-reset-password-with-otp.dto';
import { FacebookMockService } from './strategies/facebook-mock.strategy';
import { GoogleMockService } from './strategies/google-mock.strategy';
import { FirebaseAuthService } from './strategies/firebase-auth.service';
import { AuthFirebaseLoginDto } from './dto/auth-firebase-login.dto';
import { DevOnlyGuard } from '@/utils/guards/dev-only.guard';
import { ConfigService } from '@nestjs/config';

const mockOAuthLoginResponse: LoginResponseDto = {
  token: 'oauth-token',
  refreshToken: 'oauth-refresh-token',
  tokenExpires: 9999999999,
  user: { id: 1 } as User,
  user_assignments: [],
  user_permissions: {},
};

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            validateLogin: jest
              .fn()
              .mockResolvedValue({ token: 'token' } as LoginResponseDto),
            register: jest.fn().mockResolvedValue(undefined),
            confirmEmail: jest.fn().mockResolvedValue(undefined),
            confirmEmailWithOtp: jest.fn().mockResolvedValue(undefined),
            confirmNewEmail: jest.fn().mockResolvedValue(undefined),
            forgotPassword: jest.fn().mockResolvedValue(undefined),
            resetPassword: jest.fn().mockResolvedValue(undefined),
            verifyOtp: jest.fn().mockResolvedValue({ hash: 'reset-hash' }),
            resetPasswordWithOtp: jest.fn().mockResolvedValue(undefined),
            resendOtp: jest.fn().mockResolvedValue(undefined),
            resendConfirmationOtp: jest.fn().mockResolvedValue(undefined),
            me: jest.fn().mockResolvedValue({} as User),
            refreshToken: jest.fn().mockResolvedValue({} as RefreshResponseDto),
            logout: jest.fn().mockResolvedValue(undefined),
            update: jest.fn().mockResolvedValue({} as User),
            softDelete: jest.fn().mockResolvedValue(undefined),
            validateOAuthLogin: jest
              .fn()
              .mockResolvedValue(mockOAuthLoginResponse),
          },
        },
        FacebookMockService,
        GoogleMockService,
        DevOnlyGuard,
        {
          provide: FirebaseAuthService,
          useValue: {
            verifyIdToken: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'app.nodeEnv') return 'test';
              if (key === 'app.frontendDomain') return 'http://localhost:3000';
              return null;
            }),
            getOrThrow: jest.fn((key: string) => {
              if (key === 'app.nodeEnv') return 'test';
              return null;
            }),
          },
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('login', () => {
    it('should return a login response', async () => {
      const loginDto: AuthEmailLoginDto = {
        email: 'test@example.com',
        password: 'password',
      };
      const result = await authController.login(loginDto);
      expect(result).toEqual({ token: 'token' });
      expect(authService.validateLogin).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('register', () => {
    it('should call register', async () => {
      const registerDto = {
        user_id: '2020202',
        email: `user-created-${Date.now()}@cody.inc`,
        password: 'password',
        confirm_password: 'password',
        first_name: `First${Date.now()}`,
        last_name: `Last${Date.now()}`,
        cost_center: 1,
        system_admin: false,
        image: '123',
      } as AuthRegisterLoginDto;
      await authController.register(registerDto);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('me', () => {
    it('should return user info', async () => {
      const request = { user: { sessionId: 'sessionId', hash: 'hash' } };
      const result = await authController.me(request);
      expect(result).toEqual({});
      expect(authService.me).toHaveBeenCalledWith(request.user);
    });
  });

  describe('refresh', () => {
    it('should return refresh response', async () => {
      const request = { user: { sessionId: 'sessionId', hash: 'hash' } };
      const result = await authController.refresh(request);
      expect(result).toEqual({});
      expect(authService.refreshToken).toHaveBeenCalledWith({
        sessionId: request.user.sessionId,
        hash: request.user.hash,
      });
    });
  });

  describe('logout', () => {
    it('should call logout', async () => {
      const request = { user: { sessionId: 'sessionId' } };
      await authController.logout(request);
      expect(authService.logout).toHaveBeenCalledWith({
        sessionId: request.user.sessionId,
      });
    });
  });

  describe('update', () => {
    it('should update user info', async () => {
      const request = { user: { sessionId: 'sessionId', hash: 'hash' } };
      const updateDto: AuthUpdateDto = { email: 'new@example.com' };
      const result = await authController.update(request, updateDto);
      expect(result).toEqual({});
      expect(authService.update).toHaveBeenCalledWith(request.user, updateDto);
    });
  });

  describe('delete', () => {
    it('should call softDelete', async () => {
      const request = { user: { sessionId: 'sessionId' } };
      await authController.delete(request);
      expect(authService.softDelete).toHaveBeenCalledWith(request.user);
    });
  });

  describe('confirmEmail', () => {
    it('should confirm email with hash', async () => {
      const confirmEmailDto: AuthConfirmEmailDto = {
        hash: 'confirmation-hash-123',
      };
      await authController.confirmEmail(confirmEmailDto);
      expect(authService.confirmEmail).toHaveBeenCalledWith(
        confirmEmailDto.hash,
      );
    });
  });

  describe('confirmEmailWithOtp', () => {
    it('should confirm email using OTP code', async () => {
      const verifyOtpDto = {
        email: 'test@example.com',
        otp: '123456',
      };
      await authController.confirmEmailWithOtp(verifyOtpDto);
      expect(authService.confirmEmailWithOtp).toHaveBeenCalledWith(
        verifyOtpDto.email,
        verifyOtpDto.otp,
      );
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email with OTP', async () => {
      const forgotPasswordDto: AuthForgotPasswordDto = {
        email: 'test@example.com',
      };
      await authController.forgotPassword(forgotPasswordDto);
      expect(authService.forgotPassword).toHaveBeenCalledWith(
        forgotPasswordDto.email,
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset password using hash', async () => {
      const resetPasswordDto: AuthResetPasswordDto = {
        hash: 'reset-hash',
        password: 'newPassword123',
        passwordConfirmation: 'newPassword123',
      };
      await authController.resetPassword(resetPasswordDto);
      expect(authService.resetPassword).toHaveBeenCalledWith(
        resetPasswordDto.hash,
        resetPasswordDto.password,
        resetPasswordDto.passwordConfirmation,
      );
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP and return hash for password reset', async () => {
      const verifyOtpDto: AuthVerifyOtpDto = {
        email: 'test@example.com',
        otp: '123456',
      };
      const result = await authController.verifyOtp(verifyOtpDto);
      expect(result).toEqual({ hash: 'reset-hash' });
      expect(authService.verifyOtp).toHaveBeenCalledWith(
        verifyOtpDto.email,
        verifyOtpDto.otp,
      );
    });
  });

  describe('resetPasswordWithOtp', () => {
    it('should reset password directly using OTP', async () => {
      const resetPasswordDto: AuthResetPasswordWithOtpDto = {
        email: 'test@example.com',
        otp: '123456',
        password: 'newPassword123',
        passwordConfirmation: 'newPassword123',
      };
      await authController.resetPasswordWithOtp(resetPasswordDto);
      expect(authService.resetPasswordWithOtp).toHaveBeenCalledWith(
        resetPasswordDto.email,
        resetPasswordDto.otp,
        resetPasswordDto.password,
        resetPasswordDto.passwordConfirmation,
      );
    });
  });

  describe('resendOtp', () => {
    it('should resend password reset OTP', async () => {
      const resendOtpDto: AuthForgotPasswordDto = {
        email: 'test@example.com',
      };
      await authController.resendOtp(resendOtpDto);
      expect(authService.resendOtp).toHaveBeenCalledWith(resendOtpDto.email);
    });
  });

  describe('resendConfirmationOtp', () => {
    it('should resend email confirmation OTP', async () => {
      const resendOtpDto: AuthForgotPasswordDto = {
        email: 'test@example.com',
      };
      await authController.resendConfirmationOtp(resendOtpDto);
      expect(authService.resendConfirmationOtp).toHaveBeenCalledWith(
        resendOtpDto.email,
      );
    });
  });

  describe('facebookAuthCallback', () => {
    it('should call validateOAuthLogin and redirect to frontend with tokens', async () => {
      const mockRedirect = jest.fn();
      const req = {
        user: {
          provider: 'facebook',
          providerId: 'fb-123',
          email: 'fb@test.com',
          firstName: 'FB',
          lastName: 'User',
          picture: '',
          accessToken: 'fb-access',
        },
      };
      const res = { redirect: mockRedirect };

      await authController.facebookAuthCallback(req as any, res as any);

      expect(authService.validateOAuthLogin).toHaveBeenCalledWith(req.user);
      expect(mockRedirect).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:3000/en/auth/callback'),
      );
      expect(mockRedirect).toHaveBeenCalledWith(
        expect.stringContaining('token=oauth-token'),
      );
    });
  });

  describe('googleAuthCallback', () => {
    it('should call validateOAuthLogin and redirect to frontend with tokens', async () => {
      const mockRedirect = jest.fn();
      const req = {
        user: {
          provider: 'google',
          providerId: 'g-123',
          email: 'g@test.com',
          firstName: 'Google',
          lastName: 'User',
          picture: '',
          accessToken: 'g-access',
        },
      };
      const res = { redirect: mockRedirect };

      await authController.googleAuthCallback(req as any, res as any);

      expect(authService.validateOAuthLogin).toHaveBeenCalledWith(req.user);
      expect(mockRedirect).toHaveBeenCalledWith(
        expect.stringContaining('token=oauth-token'),
      );
    });
  });

  describe('facebookMockAuth', () => {
    it('should use getTestUser when scenario query param is provided', async () => {
      const mockRedirect = jest.fn();
      const req = { query: { scenario: 'new' } };
      const res = { redirect: mockRedirect };

      await authController.facebookMockAuth(req as any, res as any);

      expect(authService.validateOAuthLogin).toHaveBeenCalled();
      expect(mockRedirect).toHaveBeenCalledWith(
        expect.stringContaining('token=oauth-token'),
      );
    });

    it('should use generateMockProfile when no scenario is provided', async () => {
      const mockRedirect = jest.fn();
      const req = { query: { email: 'custom@fb.com' } };
      const res = { redirect: mockRedirect };

      await authController.facebookMockAuth(req as any, res as any);

      expect(authService.validateOAuthLogin).toHaveBeenCalled();
      expect(mockRedirect).toHaveBeenCalled();
    });
  });

  describe('googleMockAuth', () => {
    it('should use getTestUser when scenario query param is provided', async () => {
      const mockRedirect = jest.fn();
      const req = { query: { scenario: 'admin' } };
      const res = { redirect: mockRedirect };

      await authController.googleMockAuth(req as any, res as any);

      expect(authService.validateOAuthLogin).toHaveBeenCalled();
      expect(mockRedirect).toHaveBeenCalledWith(
        expect.stringContaining('token=oauth-token'),
      );
    });

    it('should use generateMockProfile when custom params are provided', async () => {
      const mockRedirect = jest.fn();
      const req = {
        query: { email: 'custom@google.com', firstName: 'Custom' },
      };
      const res = { redirect: mockRedirect };

      await authController.googleMockAuth(req as any, res as any);

      expect(authService.validateOAuthLogin).toHaveBeenCalled();
      expect(mockRedirect).toHaveBeenCalled();
    });
  });

  describe('firebaseLogin', () => {
    it('should verify Firebase token and return login response', async () => {
      const firebaseAuthService =
        module.get<FirebaseAuthService>(FirebaseAuthService);
      const mockProfile = {
        provider: 'google',
        providerId: 'firebase-uid-123',
        email: 'firebase@google.com',
        firstName: 'Fire',
        lastName: 'Base',
        picture: '',
        accessToken: 'firebase-id-token',
      };
      (firebaseAuthService.verifyIdToken as jest.Mock).mockResolvedValueOnce(
        mockProfile,
      );

      const dto: AuthFirebaseLoginDto = { idToken: 'firebase-id-token' };
      const result = await authController.firebaseLogin(dto);

      expect(firebaseAuthService.verifyIdToken).toHaveBeenCalledWith(
        'firebase-id-token',
      );
      expect(authService.validateOAuthLogin).toHaveBeenCalledWith(mockProfile);
      expect(result).toHaveProperty('token', 'oauth-token');
    });

    it('should propagate UnauthorizedException from FirebaseAuthService for invalid tokens', async () => {
      const { UnauthorizedException } = await import('@nestjs/common');
      const firebaseAuthService =
        module.get<FirebaseAuthService>(FirebaseAuthService);
      (firebaseAuthService.verifyIdToken as jest.Mock).mockRejectedValueOnce(
        new UnauthorizedException('Invalid or expired Firebase ID token'),
      );

      const dto: AuthFirebaseLoginDto = { idToken: 'bad-token' };
      await expect(authController.firebaseLogin(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
