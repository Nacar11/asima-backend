import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '@/users/users.service';
import { MailService } from '@/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { UnprocessableEntityException, HttpStatus } from '@nestjs/common';
import { PasswordResetTokenRepository } from '@/password-reset-tokens/persistence/repositories/password-reset-token.repository';
import { StatusEnum } from '@/utils/enums/status-enum';
import { JwtService } from '@nestjs/jwt';
import { UserAssignmentsService } from '@/user-assignments/user-assignments.service';
import { UserPermissionsService } from '@/user-permissions/user-permissions.service';
import { SessionService } from '@/session/session.service';
import { SocialAccountRepository } from '@/social-accounts/persistence/repositories/social-account.repository';
import { UserDetailsService } from '@/user-details/user-details.service';
import { ApplicationLoggerService } from '@/loggers/services/application.logger.service';
import { BaseSellerRepository } from '@/sellers/persistence/base-seller.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserSellerAssignmentEntity } from '@/user-seller-assignments/persistence/entities/user-seller-assignment.entity';
import { StorageService } from '@/storage/storage.service';
import { STORAGE_CONFIG } from '@/storage/storage.enum';

const mockStorageConfig = {
  provider: 's3',
  config: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
    region: 'us-east-1',
    bucket: 'test-bucket',
    endpoint: 'http://localhost:9000',
  },
};

describe('AuthService - Resend OTP with Cooldown', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let passwordResetTokenRepository: PasswordResetTokenRepository;
  let mailService: MailService;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    status: StatusEnum.CANCELLED,
  } as any;

  const mockActiveUser = {
    id: 2,
    email: 'active@example.com',
    status: StatusEnum.ACTIVE,
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
          },
        },
        {
          provide: UserAssignmentsService,
          useValue: {},
        },
        {
          provide: UserPermissionsService,
          useValue: {},
        },
        {
          provide: SessionService,
          useValue: {},
        },
        {
          provide: PasswordResetTokenRepository,
          useValue: {
            findByUserId: jest.fn(),
            deleteByUserId: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: SocialAccountRepository,
          useValue: {},
        },
        {
          provide: UserDetailsService,
          useValue: {},
        },
        {
          provide: MailService,
          useValue: {
            resendOtp: jest.fn(),
            resendConfirmationOtp: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              if (key === 'auth.forgotExpires') return '15m';
              if (key === 'auth.confirmEmailExpires') return '1d';
              return null;
            }),
          },
        },
        {
          provide: ApplicationLoggerService,
          useValue: {
            logUserActivity: jest.fn(),
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          },
        },
        {
          provide: BaseSellerRepository,
          useValue: {
            findByUserId: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserSellerAssignmentEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
        StorageService,
        { provide: STORAGE_CONFIG, useValue: mockStorageConfig },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    passwordResetTokenRepository = module.get<PasswordResetTokenRepository>(
      PasswordResetTokenRepository,
    );
    mailService = module.get<MailService>(MailService);

    // Mock Date.now to have consistent timestamps in tests
    jest.spyOn(Date, 'now').mockReturnValue(1000000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('resendConfirmationOtp', () => {
    it('should throw error if user does not exist', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      await expect(
        authService.resendConfirmationOtp('nonexistent@example.com'),
      ).rejects.toThrow(UnprocessableEntityException);

      await expect(
        authService.resendConfirmationOtp('nonexistent@example.com'),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            errors: { email: 'emailNotExists' },
          }),
        }),
      );
    });

    it('should throw error if user account is already confirmed (ACTIVE status)', async () => {
      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValue(mockActiveUser as any);

      await expect(
        authService.resendConfirmationOtp('active@example.com'),
      ).rejects.toThrow(UnprocessableEntityException);

      await expect(
        authService.resendConfirmationOtp('active@example.com'),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            errors: { email: 'alreadyConfirmed' },
          }),
        }),
      );
    });

    it('should throw error if no existing confirmation tokens found', async () => {
      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValue(mockUser as any);
      jest
        .spyOn(passwordResetTokenRepository, 'findByUserId')
        .mockResolvedValue([]);

      await expect(
        authService.resendConfirmationOtp('test@example.com'),
      ).rejects.toThrow(UnprocessableEntityException);

      await expect(
        authService.resendConfirmationOtp('test@example.com'),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            errors: { email: 'noActiveConfirmationRequest' },
          }),
        }),
      );
    });

    it('should successfully resend OTP if no previous OTP exists within cooldown period', async () => {
      const oldToken = {
        id: 1,
        user_id: 1,
        token: 'old-token',
        otp: '123456',
        created_at: new Date(1000000 - 61000), // 61 seconds ago (outside cooldown)
        expires_at: new Date(),
        used: false,
      };

      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValue(mockUser as any);
      jest
        .spyOn(passwordResetTokenRepository, 'findByUserId')
        .mockResolvedValue([oldToken] as any);
      jest
        .spyOn(passwordResetTokenRepository, 'deleteByUserId')
        .mockResolvedValue(undefined);
      jest
        .spyOn(passwordResetTokenRepository, 'create')
        .mockResolvedValue({} as any);
      jest.spyOn(mailService, 'resendConfirmationOtp').mockResolvedValue();

      await expect(
        authService.resendConfirmationOtp('test@example.com'),
      ).resolves.not.toThrow();

      expect(passwordResetTokenRepository.deleteByUserId).toHaveBeenCalledWith(
        1,
      );
      expect(passwordResetTokenRepository.create).toHaveBeenCalled();
      expect(mailService.resendConfirmationOtp).toHaveBeenCalled();
    });

    it('should block resend if previous OTP was sent within cooldown period (60 seconds)', async () => {
      const recentToken = {
        id: 1,
        user_id: 1,
        token: 'recent-token',
        otp: '123456',
        created_at: new Date(1000000 - 30000), // 30 seconds ago (within cooldown)
        expires_at: new Date(),
        used: false,
      };

      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValue(mockUser as any);
      jest
        .spyOn(passwordResetTokenRepository, 'findByUserId')
        .mockResolvedValue([recentToken] as any);

      await expect(
        authService.resendConfirmationOtp('test@example.com'),
      ).rejects.toThrow(UnprocessableEntityException);

      await expect(
        authService.resendConfirmationOtp('test@example.com'),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            errors: expect.objectContaining({
              email: expect.stringMatching(/pleaseWait\d+Seconds/),
            }),
          }),
        }),
      );

      // Should not delete tokens or send email when blocked
      expect(
        passwordResetTokenRepository.deleteByUserId,
      ).not.toHaveBeenCalled();
      expect(mailService.resendConfirmationOtp).not.toHaveBeenCalled();
    });

    it('should use the most recent token for cooldown check when multiple tokens exist', async () => {
      const oldToken = {
        id: 1,
        user_id: 1,
        created_at: new Date(1000000 - 120000), // 120 seconds ago
        expires_at: new Date(),
      };

      const recentToken = {
        id: 2,
        user_id: 1,
        created_at: new Date(1000000 - 45000), // 45 seconds ago (most recent, within cooldown)
        expires_at: new Date(),
      };

      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValue(mockUser as any);
      jest
        .spyOn(passwordResetTokenRepository, 'findByUserId')
        .mockResolvedValue([oldToken, recentToken] as any);

      await expect(
        authService.resendConfirmationOtp('test@example.com'),
      ).rejects.toThrow(UnprocessableEntityException);

      // Should be blocked by the most recent token (45s ago)
      expect(
        passwordResetTokenRepository.deleteByUserId,
      ).not.toHaveBeenCalled();
    });
  });

  describe('resendOtp', () => {
    it('should throw error if user does not exist', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      await expect(
        authService.resendOtp('nonexistent@example.com'),
      ).rejects.toThrow(UnprocessableEntityException);

      await expect(
        authService.resendOtp('nonexistent@example.com'),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            errors: { email: 'emailNotExists' },
          }),
        }),
      );
    });

    it('should throw error if no existing password reset tokens found', async () => {
      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValue(mockUser as any);
      jest
        .spyOn(passwordResetTokenRepository, 'findByUserId')
        .mockResolvedValue([]);

      await expect(authService.resendOtp('test@example.com')).rejects.toThrow(
        UnprocessableEntityException,
      );

      await expect(authService.resendOtp('test@example.com')).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            errors: { email: 'noActiveResetRequest' },
          }),
        }),
      );
    });

    it('should successfully resend password reset OTP if cooldown period has passed', async () => {
      const oldToken = {
        id: 1,
        user_id: 1,
        token: 'old-token',
        otp: '123456',
        created_at: new Date(1000000 - 70000), // 70 seconds ago (outside cooldown)
        expires_at: new Date(),
        used: false,
      };

      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValue(mockUser as any);
      jest
        .spyOn(passwordResetTokenRepository, 'findByUserId')
        .mockResolvedValue([oldToken] as any);
      jest
        .spyOn(passwordResetTokenRepository, 'deleteByUserId')
        .mockResolvedValue(undefined);
      jest
        .spyOn(passwordResetTokenRepository, 'create')
        .mockResolvedValue({} as any);
      jest.spyOn(mailService, 'resendOtp').mockResolvedValue();

      await expect(
        authService.resendOtp('test@example.com'),
      ).resolves.not.toThrow();

      expect(passwordResetTokenRepository.deleteByUserId).toHaveBeenCalledWith(
        1,
      );
      expect(passwordResetTokenRepository.create).toHaveBeenCalled();
      expect(mailService.resendOtp).toHaveBeenCalled();
    });

    it('should block resend if previous password reset OTP was sent within 60 seconds', async () => {
      const recentToken = {
        id: 1,
        user_id: 1,
        token: 'recent-token',
        otp: '654321',
        created_at: new Date(1000000 - 20000), // 20 seconds ago (within cooldown)
        expires_at: new Date(),
        used: false,
      };

      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValue(mockUser as any);
      jest
        .spyOn(passwordResetTokenRepository, 'findByUserId')
        .mockResolvedValue([recentToken] as any);

      await expect(authService.resendOtp('test@example.com')).rejects.toThrow(
        UnprocessableEntityException,
      );

      await expect(authService.resendOtp('test@example.com')).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            errors: expect.objectContaining({
              email: expect.stringMatching(/pleaseWait\d+Seconds/),
            }),
          }),
        }),
      );

      expect(
        passwordResetTokenRepository.deleteByUserId,
      ).not.toHaveBeenCalled();
      expect(mailService.resendOtp).not.toHaveBeenCalled();
    });

    it('should return correct remaining seconds in error message', async () => {
      const recentToken = {
        id: 1,
        user_id: 1,
        created_at: new Date(1000000 - 18000), // 18 seconds ago
        expires_at: new Date(),
      };

      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValue(mockUser as any);
      jest
        .spyOn(passwordResetTokenRepository, 'findByUserId')
        .mockResolvedValue([recentToken] as any);

      try {
        await authService.resendOtp('test@example.com');
      } catch (error) {
        expect(error.response.errors.email).toMatch(/pleaseWait4\dSeconds/);
        // Should be approximately 42 seconds remaining (60 - 18)
      }
    });
  });

  describe('Cooldown edge cases', () => {
    it('should allow resend exactly after 60 seconds', async () => {
      const tokenAt60Seconds = {
        id: 1,
        user_id: 1,
        created_at: new Date(1000000 - 60000), // Exactly 60 seconds ago
        expires_at: new Date(),
      };

      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValue(mockUser as any);
      jest
        .spyOn(passwordResetTokenRepository, 'findByUserId')
        .mockResolvedValue([tokenAt60Seconds] as any);
      jest
        .spyOn(passwordResetTokenRepository, 'deleteByUserId')
        .mockResolvedValue(undefined);
      jest
        .spyOn(passwordResetTokenRepository, 'create')
        .mockResolvedValue({} as any);
      jest.spyOn(mailService, 'resendConfirmationOtp').mockResolvedValue();

      await expect(
        authService.resendConfirmationOtp('test@example.com'),
      ).resolves.not.toThrow();

      expect(mailService.resendConfirmationOtp).toHaveBeenCalled();
    });

    it('should block resend at 59.9 seconds (just before cooldown expires)', async () => {
      const tokenAt59Seconds = {
        id: 1,
        user_id: 1,
        created_at: new Date(1000000 - 59900), // 59.9 seconds ago
        expires_at: new Date(),
      };

      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValue(mockUser as any);
      jest
        .spyOn(passwordResetTokenRepository, 'findByUserId')
        .mockResolvedValue([tokenAt59Seconds] as any);

      await expect(
        authService.resendConfirmationOtp('test@example.com'),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });
});

describe('AuthService - Email Change OTP', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let passwordResetTokenRepository: PasswordResetTokenRepository;
  let mailService: MailService;
  let applicationLoggerService: ApplicationLoggerService;

  const mockActiveUser = {
    id: 1,
    email: 'current@example.com',
    status: StatusEnum.ACTIVE,
  } as any;

  const mockInactiveUser = {
    id: 2,
    email: 'inactive@example.com',
    status: StatusEnum.CANCELLED,
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: UserAssignmentsService,
          useValue: {},
        },
        {
          provide: UserPermissionsService,
          useValue: {},
        },
        {
          provide: SessionService,
          useValue: {},
        },
        {
          provide: PasswordResetTokenRepository,
          useValue: {
            findByUserId: jest.fn(),
            findValidOtp: jest.fn(),
            deleteByUserId: jest.fn(),
            deleteEmailChangeTokensByUserId: jest.fn(),
            create: jest.fn(),
            markAsUsedIfUnused: jest.fn(),
          },
        },
        {
          provide: SocialAccountRepository,
          useValue: {},
        },
        {
          provide: UserDetailsService,
          useValue: {},
        },
        {
          provide: MailService,
          useValue: {
            resendOtp: jest.fn(),
            resendConfirmationOtp: jest.fn(),
            resendEmailChangeOtp: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              if (key === 'auth.forgotExpires') return '15m';
              if (key === 'auth.confirmEmailExpires') return '1d';
              return null;
            }),
          },
        },
        {
          provide: ApplicationLoggerService,
          useValue: {
            logUserActivity: jest.fn(),
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          },
        },
        {
          provide: BaseSellerRepository,
          useValue: {
            findByUserId: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserSellerAssignmentEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
        StorageService,
        { provide: STORAGE_CONFIG, useValue: mockStorageConfig },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    passwordResetTokenRepository = module.get<PasswordResetTokenRepository>(
      PasswordResetTokenRepository,
    );
    mailService = module.get<MailService>(MailService);
    applicationLoggerService = module.get<ApplicationLoggerService>(
      ApplicationLoggerService,
    );

    // Mock Date.now to have consistent timestamps in tests
    jest.spyOn(Date, 'now').mockReturnValue(1000000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('resendEmailChangeOtp', () => {
    it('should throw error if user does not exist', async () => {
      jest.spyOn(usersService, 'findById').mockResolvedValue(null);

      await expect(authService.resendEmailChangeOtp(1)).rejects.toThrow(
        UnprocessableEntityException,
      );

      await expect(authService.resendEmailChangeOtp(1)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            errors: { user: 'userNotFound' },
          }),
        }),
      );
    });

    it('should throw error if user account is not active', async () => {
      jest
        .spyOn(usersService, 'findById')
        .mockResolvedValue(mockInactiveUser as any);

      await expect(authService.resendEmailChangeOtp(2)).rejects.toThrow(
        UnprocessableEntityException,
      );

      await expect(authService.resendEmailChangeOtp(2)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            errors: { user: 'accountNotActive' },
          }),
        }),
      );
    });

    it('should throw error if no existing email change tokens found', async () => {
      jest
        .spyOn(usersService, 'findById')
        .mockResolvedValue(mockActiveUser as any);
      jest
        .spyOn(passwordResetTokenRepository, 'findByUserId')
        .mockResolvedValue([]);

      await expect(authService.resendEmailChangeOtp(1)).rejects.toThrow(
        UnprocessableEntityException,
      );

      await expect(authService.resendEmailChangeOtp(1)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            errors: { email: 'noActiveEmailChangeRequest' },
          }),
        }),
      );
    });

    it('should throw error if tokens exist but none have email_change type', async () => {
      const nonEmailChangeToken = {
        id: 1,
        user_id: 1,
        created_at: new Date(1000000 - 120000),
        expires_at: new Date(),
        metadata: { type: 'password_reset' },
      };

      jest
        .spyOn(usersService, 'findById')
        .mockResolvedValue(mockActiveUser as any);
      jest
        .spyOn(passwordResetTokenRepository, 'findByUserId')
        .mockResolvedValue([nonEmailChangeToken] as any);

      await expect(authService.resendEmailChangeOtp(1)).rejects.toThrow(
        UnprocessableEntityException,
      );

      await expect(authService.resendEmailChangeOtp(1)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            errors: { email: 'noActiveEmailChangeRequest' },
          }),
        }),
      );
    });

    it('should throw error if token metadata is missing new_email', async () => {
      const tokenWithoutNewEmail = {
        id: 1,
        user_id: 1,
        created_at: new Date(1000000 - 120000),
        expires_at: new Date(),
        metadata: { type: 'email_change' }, // Missing new_email
      };

      jest
        .spyOn(usersService, 'findById')
        .mockResolvedValue(mockActiveUser as any);
      jest
        .spyOn(passwordResetTokenRepository, 'findByUserId')
        .mockResolvedValue([tokenWithoutNewEmail] as any);

      await expect(authService.resendEmailChangeOtp(1)).rejects.toThrow(
        UnprocessableEntityException,
      );

      await expect(authService.resendEmailChangeOtp(1)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            errors: { email: 'noActiveEmailChangeRequest' },
          }),
        }),
      );
    });

    it('should block resend if within 60-second cooldown period', async () => {
      const recentToken = {
        id: 1,
        user_id: 1,
        created_at: new Date(1000000 - 30000), // 30 seconds ago
        expires_at: new Date(),
        metadata: { type: 'email_change', new_email: 'new@example.com' },
      };

      jest
        .spyOn(usersService, 'findById')
        .mockResolvedValue(mockActiveUser as any);
      jest
        .spyOn(passwordResetTokenRepository, 'findByUserId')
        .mockResolvedValue([recentToken] as any);

      await expect(authService.resendEmailChangeOtp(1)).rejects.toThrow(
        UnprocessableEntityException,
      );

      await expect(authService.resendEmailChangeOtp(1)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            errors: expect.objectContaining({
              email: expect.stringMatching(/pleaseWait\d+Seconds/),
            }),
          }),
        }),
      );

      expect(
        passwordResetTokenRepository.deleteEmailChangeTokensByUserId,
      ).not.toHaveBeenCalled();
      expect(mailService.resendEmailChangeOtp).not.toHaveBeenCalled();
    });

    it('should throw error if email is now taken by another user', async () => {
      const oldToken = {
        id: 1,
        user_id: 1,
        created_at: new Date(1000000 - 70000), // 70 seconds ago
        expires_at: new Date(),
        metadata: { type: 'email_change', new_email: 'taken@example.com' },
      };

      const anotherUser = {
        id: 999,
        email: 'taken@example.com',
        status: StatusEnum.ACTIVE,
      };

      jest
        .spyOn(usersService, 'findById')
        .mockResolvedValue(mockActiveUser as any);
      jest
        .spyOn(passwordResetTokenRepository, 'findByUserId')
        .mockResolvedValue([oldToken] as any);
      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValue(anotherUser as any);

      await expect(authService.resendEmailChangeOtp(1)).rejects.toThrow(
        UnprocessableEntityException,
      );

      await expect(authService.resendEmailChangeOtp(1)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            errors: { email: 'emailExists' },
          }),
        }),
      );
    });

    it('should successfully resend OTP after cooldown passes', async () => {
      const oldToken = {
        id: 1,
        user_id: 1,
        created_at: new Date(1000000 - 70000), // 70 seconds ago (outside cooldown)
        expires_at: new Date(),
        metadata: { type: 'email_change', new_email: 'new@example.com' },
      };

      jest
        .spyOn(usersService, 'findById')
        .mockResolvedValue(mockActiveUser as any);
      jest
        .spyOn(passwordResetTokenRepository, 'findByUserId')
        .mockResolvedValue([oldToken] as any);
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
      jest
        .spyOn(passwordResetTokenRepository, 'deleteEmailChangeTokensByUserId')
        .mockResolvedValue(undefined);
      jest
        .spyOn(passwordResetTokenRepository, 'create')
        .mockResolvedValue({} as any);
      jest.spyOn(mailService, 'resendEmailChangeOtp').mockResolvedValue();

      await expect(authService.resendEmailChangeOtp(1)).resolves.not.toThrow();

      expect(
        passwordResetTokenRepository.deleteEmailChangeTokensByUserId,
      ).toHaveBeenCalledWith(1);
      expect(passwordResetTokenRepository.create).toHaveBeenCalled();
      expect(mailService.resendEmailChangeOtp).toHaveBeenCalled();
    });

    it('should use the most recent email change token for cooldown check', async () => {
      const oldToken = {
        id: 1,
        user_id: 1,
        created_at: new Date(1000000 - 120000), // 120 seconds ago
        expires_at: new Date(),
        metadata: { type: 'email_change', new_email: 'new@example.com' },
      };

      const recentToken = {
        id: 2,
        user_id: 1,
        created_at: new Date(1000000 - 45000), // 45 seconds ago (most recent, within cooldown)
        expires_at: new Date(),
        metadata: { type: 'email_change', new_email: 'new@example.com' },
      };

      jest
        .spyOn(usersService, 'findById')
        .mockResolvedValue(mockActiveUser as any);
      jest
        .spyOn(passwordResetTokenRepository, 'findByUserId')
        .mockResolvedValue([oldToken, recentToken] as any);

      await expect(authService.resendEmailChangeOtp(1)).rejects.toThrow(
        UnprocessableEntityException,
      );

      // Should be blocked by the most recent token (45s ago)
      expect(
        passwordResetTokenRepository.deleteEmailChangeTokensByUserId,
      ).not.toHaveBeenCalled();
    });
  });

  describe('confirmEmailChangeWithOtp', () => {
    it('should throw error if user does not exist', async () => {
      jest.spyOn(usersService, 'findById').mockResolvedValue(null);

      await expect(
        authService.confirmEmailChangeWithOtp(1, '123456'),
      ).rejects.toThrow(UnprocessableEntityException);

      await expect(
        authService.confirmEmailChangeWithOtp(1, '123456'),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            errors: { user: 'userNotFound' },
          }),
        }),
      );
    });

    it('should throw error if user account is not active', async () => {
      jest
        .spyOn(usersService, 'findById')
        .mockResolvedValue(mockInactiveUser as any);

      await expect(
        authService.confirmEmailChangeWithOtp(2, '123456'),
      ).rejects.toThrow(UnprocessableEntityException);

      await expect(
        authService.confirmEmailChangeWithOtp(2, '123456'),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            errors: { user: 'accountNotActive' },
          }),
        }),
      );
    });

    it('should throw error if OTP is invalid or expired', async () => {
      jest
        .spyOn(usersService, 'findById')
        .mockResolvedValue(mockActiveUser as any);
      jest
        .spyOn(passwordResetTokenRepository, 'findValidOtp')
        .mockResolvedValue(null);

      await expect(
        authService.confirmEmailChangeWithOtp(1, 'invalid-otp'),
      ).rejects.toThrow(UnprocessableEntityException);

      await expect(
        authService.confirmEmailChangeWithOtp(1, 'invalid-otp'),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            errors: { otp: 'invalidOrExpired' },
          }),
        }),
      );
    });

    it('should throw error if OTP belongs to a different user', async () => {
      const otpBelongingToAnotherUser = {
        id: 1,
        user_id: 999, // Different user
        otp: '123456',
        metadata: { type: 'email_change', new_email: 'new@example.com' },
      };

      jest
        .spyOn(usersService, 'findById')
        .mockResolvedValue(mockActiveUser as any);
      jest
        .spyOn(passwordResetTokenRepository, 'findValidOtp')
        .mockResolvedValue(otpBelongingToAnotherUser as any);

      await expect(
        authService.confirmEmailChangeWithOtp(1, '123456'),
      ).rejects.toThrow(UnprocessableEntityException);

      await expect(
        authService.confirmEmailChangeWithOtp(1, '123456'),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            errors: { otp: 'invalidOrExpired' },
          }),
        }),
      );
    });

    it('should throw error if OTP is not for email change', async () => {
      const passwordResetOtp = {
        id: 1,
        user_id: 1,
        otp: '123456',
        metadata: { type: 'password_reset' }, // Not email_change
      };

      jest
        .spyOn(usersService, 'findById')
        .mockResolvedValue(mockActiveUser as any);
      jest
        .spyOn(passwordResetTokenRepository, 'findValidOtp')
        .mockResolvedValue(passwordResetOtp as any);

      await expect(
        authService.confirmEmailChangeWithOtp(1, '123456'),
      ).rejects.toThrow(UnprocessableEntityException);

      await expect(
        authService.confirmEmailChangeWithOtp(1, '123456'),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            errors: { otp: 'invalidOrExpired' },
          }),
        }),
      );
    });

    it('should throw error if new_email is missing from metadata', async () => {
      const tokenWithoutNewEmail = {
        id: 1,
        user_id: 1,
        otp: '123456',
        metadata: { type: 'email_change' }, // Missing new_email
      };

      jest
        .spyOn(usersService, 'findById')
        .mockResolvedValue(mockActiveUser as any);
      jest
        .spyOn(passwordResetTokenRepository, 'findValidOtp')
        .mockResolvedValue(tokenWithoutNewEmail as any);

      await expect(
        authService.confirmEmailChangeWithOtp(1, '123456'),
      ).rejects.toThrow(UnprocessableEntityException);

      await expect(
        authService.confirmEmailChangeWithOtp(1, '123456'),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            errors: { otp: 'missingEmailChangeMetadata' },
          }),
        }),
      );
    });

    it('should throw error if email is now taken by another user (race condition)', async () => {
      const validToken = {
        id: 1,
        user_id: 1,
        otp: '123456',
        metadata: { type: 'email_change', new_email: 'taken@example.com' },
      };

      const anotherUser = {
        id: 999,
        email: 'taken@example.com',
        status: StatusEnum.ACTIVE,
      };

      jest
        .spyOn(usersService, 'findById')
        .mockResolvedValue(mockActiveUser as any);
      jest
        .spyOn(passwordResetTokenRepository, 'findValidOtp')
        .mockResolvedValue(validToken as any);
      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValue(anotherUser as any);

      await expect(
        authService.confirmEmailChangeWithOtp(1, '123456'),
      ).rejects.toThrow(UnprocessableEntityException);

      await expect(
        authService.confirmEmailChangeWithOtp(1, '123456'),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            errors: { email: 'emailExists' },
          }),
        }),
      );
    });

    it('should throw error if OTP was already used (race condition)', async () => {
      const validToken = {
        id: 1,
        user_id: 1,
        otp: '123456',
        metadata: { type: 'email_change', new_email: 'new@example.com' },
      };

      jest
        .spyOn(usersService, 'findById')
        .mockResolvedValue(mockActiveUser as any);
      jest
        .spyOn(passwordResetTokenRepository, 'findValidOtp')
        .mockResolvedValue(validToken as any);
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
      jest
        .spyOn(passwordResetTokenRepository, 'markAsUsedIfUnused')
        .mockResolvedValue(false); // Already used

      await expect(
        authService.confirmEmailChangeWithOtp(1, '123456'),
      ).rejects.toThrow(UnprocessableEntityException);

      await expect(
        authService.confirmEmailChangeWithOtp(1, '123456'),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            errors: { otp: 'invalidOrExpired' },
          }),
        }),
      );
    });

    it('should successfully update user email', async () => {
      const validToken = {
        id: 1,
        user_id: 1,
        otp: '123456',
        metadata: { type: 'email_change', new_email: 'new@example.com' },
      };

      jest
        .spyOn(usersService, 'findById')
        .mockResolvedValue(mockActiveUser as any);
      jest
        .spyOn(passwordResetTokenRepository, 'findValidOtp')
        .mockResolvedValue(validToken as any);
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
      jest
        .spyOn(passwordResetTokenRepository, 'markAsUsedIfUnused')
        .mockResolvedValue(true);
      jest
        .spyOn(usersService, 'update')
        .mockResolvedValue({ ...mockActiveUser, email: 'new@example.com' });
      jest
        .spyOn(passwordResetTokenRepository, 'deleteEmailChangeTokensByUserId')
        .mockResolvedValue(undefined);

      await expect(
        authService.confirmEmailChangeWithOtp(1, '123456'),
      ).resolves.not.toThrow();

      expect(usersService.update).toHaveBeenCalledWith(1, {
        email: 'new@example.com',
      });
    });

    it('should log email change activity', async () => {
      const validToken = {
        id: 1,
        user_id: 1,
        otp: '123456',
        metadata: { type: 'email_change', new_email: 'new@example.com' },
      };

      jest
        .spyOn(usersService, 'findById')
        .mockResolvedValue(mockActiveUser as any);
      jest
        .spyOn(passwordResetTokenRepository, 'findValidOtp')
        .mockResolvedValue(validToken as any);
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
      jest
        .spyOn(passwordResetTokenRepository, 'markAsUsedIfUnused')
        .mockResolvedValue(true);
      jest
        .spyOn(usersService, 'update')
        .mockResolvedValue({ ...mockActiveUser, email: 'new@example.com' });
      jest
        .spyOn(passwordResetTokenRepository, 'deleteEmailChangeTokensByUserId')
        .mockResolvedValue(undefined);

      await authService.confirmEmailChangeWithOtp(1, '123456');

      expect(applicationLoggerService.logUserActivity).toHaveBeenCalledWith(
        'Email address changed',
        1,
        {
          oldEmail: 'current@example.com',
          newEmail: 'new@example.com',
          action: 'email_change',
        },
      );
    });

    it('should delete all email change tokens after success', async () => {
      const validToken = {
        id: 1,
        user_id: 1,
        otp: '123456',
        metadata: { type: 'email_change', new_email: 'new@example.com' },
      };

      jest
        .spyOn(usersService, 'findById')
        .mockResolvedValue(mockActiveUser as any);
      jest
        .spyOn(passwordResetTokenRepository, 'findValidOtp')
        .mockResolvedValue(validToken as any);
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
      jest
        .spyOn(passwordResetTokenRepository, 'markAsUsedIfUnused')
        .mockResolvedValue(true);
      jest
        .spyOn(usersService, 'update')
        .mockResolvedValue({ ...mockActiveUser, email: 'new@example.com' });
      jest
        .spyOn(passwordResetTokenRepository, 'deleteEmailChangeTokensByUserId')
        .mockResolvedValue(undefined);

      await authService.confirmEmailChangeWithOtp(1, '123456');

      expect(
        passwordResetTokenRepository.deleteEmailChangeTokensByUserId,
      ).toHaveBeenCalledWith(1);
    });
  });
});

describe('AuthService - validateOAuthLogin', () => {
  let authService: AuthService;

  const mockSocialAccountRepository = {
    findByProviderAndProviderId: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  };

  const mockUsersService = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const mockSessionService = {
    create: jest.fn(),
  };

  const mockUserAssignmentsService = {
    getUserGroupsFromAssignments: jest.fn(),
  };

  const mockUserPermissionsService = {
    getUserPermissions: jest.fn(),
  };

  const mockSellerRepository = {
    findByUserId: jest.fn(),
    findById: jest.fn(),
  };

  const mockUserSellerAssignmentRepository = {
    findOne: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('signed-jwt-token'),
  };

  const authConfigMap: Record<string, any> = {
    'auth.secret': 'test-secret',
    'auth.expires': '30d',
    'auth.refreshSecret': 'test-refresh-secret',
    'auth.refreshExpires': '3650d',
  };

  const mockConfigService = {
    get: jest.fn((key: string) => authConfigMap[key] ?? null),
    getOrThrow: jest.fn((key: string) => {
      const val = authConfigMap[key];
      if (val === undefined) throw new Error(`Config key not found: ${key}`);
      return val;
    }),
  };

  const baseUser = {
    id: 42,
    email: 'oauth@example.com',
    first_name: 'OAuth',
    last_name: 'User',
    system_admin: false,
    deleted_at: null,
    seller: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: UsersService, useValue: mockUsersService },
        {
          provide: UserAssignmentsService,
          useValue: mockUserAssignmentsService,
        },
        {
          provide: UserPermissionsService,
          useValue: mockUserPermissionsService,
        },
        { provide: SessionService, useValue: mockSessionService },
        {
          provide: PasswordResetTokenRepository,
          useValue: {
            findByUserId: jest.fn(),
            deleteByUserId: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: SocialAccountRepository,
          useValue: mockSocialAccountRepository,
        },
        { provide: UserDetailsService, useValue: {} },
        {
          provide: ApplicationLoggerService,
          useValue: { log: jest.fn(), error: jest.fn(), warn: jest.fn() },
        },
        { provide: BaseSellerRepository, useValue: mockSellerRepository },
        {
          provide: getRepositoryToken(UserSellerAssignmentEntity),
          useValue: mockUserSellerAssignmentRepository,
        },
        { provide: MailService, useValue: { userSignUp: jest.fn() } },
        { provide: ConfigService, useValue: mockConfigService },
        StorageService,
        { provide: STORAGE_CONFIG, useValue: mockStorageConfig },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);

    // Default happy-path stubs
    mockSessionService.create.mockResolvedValue({ id: 'session-id-abc' });
    mockSellerRepository.findByUserId.mockResolvedValue(null);
    mockUserSellerAssignmentRepository.findOne.mockResolvedValue(null);
    mockUserAssignmentsService.getUserGroupsFromAssignments.mockResolvedValue(
      [],
    );
    mockUserPermissionsService.getUserPermissions.mockResolvedValue({});
    mockJwtService.signAsync.mockResolvedValue('signed-jwt-token');
  });

  const googleProfile = {
    provider: 'google',
    providerId: 'google-uid-123',
    email: 'oauth@example.com',
    firstName: 'OAuth',
    lastName: 'User',
    picture: '',
    accessToken: 'google-access-token',
    refreshToken: 'google-refresh-token',
  };

  describe('existing social account', () => {
    it('should find user by social account and update tokens', async () => {
      const existingSocialAccount = { id: 1, user_id: 42 };
      mockSocialAccountRepository.findByProviderAndProviderId.mockResolvedValue(
        existingSocialAccount,
      );
      mockUsersService.findById.mockResolvedValue({ ...baseUser });
      mockSocialAccountRepository.update.mockResolvedValue(undefined);

      const result = await authService.validateOAuthLogin(googleProfile as any);

      expect(
        mockSocialAccountRepository.findByProviderAndProviderId,
      ).toHaveBeenCalledWith('google', 'google-uid-123');
      expect(mockUsersService.findById).toHaveBeenCalledWith(42);
      expect(mockSocialAccountRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          access_token: 'google-access-token',
          refresh_token: 'google-refresh-token',
        }),
      );
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('tokenExpires');
    });
  });

  describe('new social account — existing user by email', () => {
    it('should link new social account to an existing user found by email', async () => {
      mockSocialAccountRepository.findByProviderAndProviderId.mockResolvedValue(
        null,
      );
      mockUsersService.findByEmail.mockResolvedValue({ ...baseUser });
      mockSocialAccountRepository.create.mockResolvedValue(undefined);

      const result = await authService.validateOAuthLogin(googleProfile as any);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'oauth@example.com',
      );
      expect(mockUsersService.create).not.toHaveBeenCalled();
      expect(mockSocialAccountRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 42,
          provider: 'google',
          provider_id: 'google-uid-123',
        }),
      );
      expect(result).toHaveProperty('token');
    });
  });

  describe('new social account — brand new user', () => {
    it('should create a new user and social account when no match found', async () => {
      mockSocialAccountRepository.findByProviderAndProviderId.mockResolvedValue(
        null,
      );
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue({ ...baseUser });
      mockUsersService.update.mockResolvedValue(undefined);
      mockSocialAccountRepository.create.mockResolvedValue(undefined);

      const result = await authService.validateOAuthLogin({
        ...googleProfile,
        picture: '',
      } as any);

      expect(mockUsersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'oauth@example.com',
          first_name: 'OAuth',
          last_name: 'User',
          system_admin: false,
        }),
      );
      expect(result).toHaveProperty('token');
    });

    it('should set system_admin from profile.systemAdmin flag', async () => {
      mockSocialAccountRepository.findByProviderAndProviderId.mockResolvedValue(
        null,
      );
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue({
        ...baseUser,
        system_admin: true,
      });
      mockSocialAccountRepository.create.mockResolvedValue(undefined);

      const adminProfile = { ...googleProfile, systemAdmin: true, picture: '' };
      await authService.validateOAuthLogin(adminProfile as any);

      expect(mockUsersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ system_admin: true }),
      );
    });
  });

  describe('deleted user', () => {
    it('should throw UnprocessableEntityException when user is soft-deleted', async () => {
      const existingSocialAccount = { id: 1, user_id: 99 };
      mockSocialAccountRepository.findByProviderAndProviderId.mockResolvedValue(
        existingSocialAccount,
      );
      mockUsersService.findById.mockResolvedValue({
        ...baseUser,
        id: 99,
        deleted_at: new Date(),
      });

      await expect(
        authService.validateOAuthLogin(googleProfile as any),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('store context', () => {
    it('should include seller_id and is_store_owner=true when user owns a store', async () => {
      const existingSocialAccount = { id: 1, user_id: 42 };
      mockSocialAccountRepository.findByProviderAndProviderId.mockResolvedValue(
        existingSocialAccount,
      );
      mockUsersService.findById.mockResolvedValue({ ...baseUser });
      mockSellerRepository.findByUserId.mockResolvedValue({ id: 7 });

      const result = await authService.validateOAuthLogin(googleProfile as any);

      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({ seller_id: 7, is_store_owner: true }),
        expect.anything(),
      );
      expect(result).toHaveProperty('token');
    });
  });
});
