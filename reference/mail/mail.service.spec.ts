import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MailerService } from '@/mailer/mailer.service';
import { ConfigService } from '@nestjs/config';
import { I18nContext } from 'nestjs-i18n';
import { MailData } from './interfaces/mail-data.interface';
import path from 'path';

const mockI18nContext = {
  t: jest.fn((key: string) => {
    const translations = {
      'common.confirmEmail': 'Confirm your email',
      'confirm-email.text1': 'Welcome!',
      'confirm-email.text2': 'Please confirm your email.',
      'confirm-email.text3': 'Thank you for signing up!',
      'common.resetPassword': 'Reset Password',
      'reset-password.text1': 'Forgot your password?',
      'reset-password.text2': 'Use the link below to reset it.',
      'reset-password.text3': 'The link will expire soon.',
      'reset-password.text4': "If you didn't request this, ignore it.",
    };
    return translations[key];
  }),
};

// Mock for ConfigService to provide get and getOrThrow methods
const mockConfigService = {
  getOrThrow: jest.fn(),
  get: jest.fn(),
};

describe('MailService', () => {
  let mailService: MailService;
  let mailerService: MailerService;
  const originalAwsS3PublicEndpoint = process.env.AWS_S3_PUBLIC_ENDPOINT;
  const originalAwsDefaultS3Bucket = process.env.AWS_DEFAULT_S3_BUCKET;

  afterAll(() => {
    if (originalAwsS3PublicEndpoint === undefined) {
      delete process.env.AWS_S3_PUBLIC_ENDPOINT;
    } else {
      process.env.AWS_S3_PUBLIC_ENDPOINT = originalAwsS3PublicEndpoint;
    }

    if (originalAwsDefaultS3Bucket === undefined) {
      delete process.env.AWS_DEFAULT_S3_BUCKET;
    } else {
      process.env.AWS_DEFAULT_S3_BUCKET = originalAwsDefaultS3Bucket;
    }
  });

  beforeEach(async () => {
    mockConfigService.getOrThrow.mockReset();
    mockConfigService.get.mockReset();
    process.env.AWS_S3_PUBLIC_ENDPOINT =
      'https://adtokart-prod-uploads-477956547985.s3.ap-southeast-1.amazonaws.com';
    process.env.AWS_DEFAULT_S3_BUCKET = 'adtokart-prod-uploads-477956547985';

    mockConfigService.getOrThrow.mockImplementation((key: string) => {
      const config = {
        'app.frontendDomain': 'http://localhost:3000',
        'app.workingDirectory': process.cwd(),
        'app.backendDomain': 'http://localhost:4080',
      };
      return config[key];
    });

    mockConfigService.get.mockImplementation((key: string) => {
      const config = {
        'app.name': 'TestApp',
        'app.frontendDomain': 'http://localhost:3000',
        'mail.logoUrl': undefined,
      };
      return config[key];
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
    mailerService = module.get<MailerService>(MailerService);

    jest.spyOn(I18nContext, 'current').mockReturnValue(mockI18nContext as any);
  });

  it('should send a user signup email with OTP', async () => {
    const mailData: MailData<{
      hash: string;
      otp: string;
      tokenExpires: number;
    }> = {
      to: 'user@cody.inc',
      data: {
        hash: 'abc123',
        otp: '123456',
        tokenExpires: 5,
      },
    };

    await mailService.userSignUp(mailData);

    const expectedTemplatePath = path.join(
      process.cwd(),
      'src',
      'mail',
      'mail-templates',
      'activation.hbs',
    );

    expect(mailerService.sendMail).toHaveBeenCalledWith({
      to: 'user@cody.inc',
      subject: 'Confirm your email',
      text: 'http://localhost:3000/confirm-email?hash=abc123&expires=5 Confirm your email. Your OTP code is: 123456',
      templatePath: expectedTemplatePath,
      context: {
        title: 'Confirm your email',
        url: 'http://localhost:3000/confirm-email?hash=abc123&expires=5',
        actionTitle: 'Confirm your email',
        app_name: 'TestApp',
        logo_url: 'https://adtokart.com/adtokart_logo.png',
        otp: '123456',
        text1: 'Welcome!',
        text2: 'Please confirm your email.',
        text3: 'Thank you for signing up!',
      },
    });
  });

  it('should send a forgot password email with OTP', async () => {
    const mailData: MailData<{
      hash: string;
      otp: string;
      tokenExpires: number;
    }> = {
      to: 'user@cody.inc',
      data: {
        hash: 'reset-hash-123',
        otp: '654321',
        tokenExpires: 5,
      },
    };

    await mailService.forgotPassword(mailData);

    const expectedTemplatePath = path.join(
      process.cwd(),
      'src',
      'mail',
      'mail-templates',
      'reset-password.hbs',
    );

    expect(mailerService.sendMail).toHaveBeenCalledWith({
      to: 'user@cody.inc',
      subject: 'Reset Password',
      text: 'http://localhost:3000/password-change?hash=reset-hash-123&expires=5 Reset Password. Your OTP code is: 654321',
      templatePath: expectedTemplatePath,
      context: {
        title: 'Reset Password',
        url: 'http://localhost:3000/password-change?hash=reset-hash-123&expires=5',
        actionTitle: 'Reset Password',
        app_name: 'TestApp',
        logo_url: 'https://adtokart.com/adtokart_logo.png',
        otp: '654321',
        text1: 'Forgot your password?',
        text2: 'Use the link below to reset it.',
        text3: 'The link will expire soon.',
        text4: "If you didn't request this, ignore it.",
      },
    });
  });

  it('should send account deletion OTP with fallback logo URL', async () => {
    await mailService.sendAccountDeletionOTP('user@cody.inc', '654321');

    const expectedTemplatePath = path.join(
      process.cwd(),
      'src',
      'mail',
      'mail-templates',
      'account-deletion-otp.hbs',
    );

    expect(mailerService.sendMail).toHaveBeenCalledWith({
      to: 'user@cody.inc',
      subject: 'Verify Your Account Deletion Request - Adtokart',
      templatePath: expectedTemplatePath,
      context: {
        email: 'user@cody.inc',
        otp: '654321',
        expiresInMinutes: 5,
        app_name: 'TestApp',
        logo_url: 'https://adtokart.com/adtokart_logo.png',
      },
    });
  });

  it('should use configured MAIL_LOGO_URL when AWS vars are missing', async () => {
    delete process.env.AWS_S3_PUBLIC_ENDPOINT;
    delete process.env.AWS_DEFAULT_S3_BUCKET;

    mockConfigService.get.mockImplementation((key: string) => {
      const config = {
        'app.name': 'TestApp',
        'mail.logoUrl': 'https://cdn.example.com/adtokart_logo.png',
      };
      return config[key];
    });

    const mailData: MailData<{
      hash: string;
      otp: string;
      tokenExpires: number;
    }> = {
      to: 'user@cody.inc',
      data: {
        hash: 'abc123',
        otp: '123456',
        tokenExpires: 5,
      },
    };

    await mailService.userSignUp(mailData);

    expect(mailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          logo_url: 'https://cdn.example.com/adtokart_logo.png',
        }),
      }),
    );
  });

  it('should fall back to default logo URL when MAIL_LOGO_URL is missing', async () => {
    delete process.env.AWS_S3_PUBLIC_ENDPOINT;
    delete process.env.AWS_DEFAULT_S3_BUCKET;

    mockConfigService.get.mockImplementation((key: string) => {
      const config = {
        'app.name': 'TestApp',
        'app.frontendDomain': 'https://app.example.com/',
        'mail.logoUrl': undefined,
      };
      return config[key];
    });

    const mailData: MailData<{
      hash: string;
      otp: string;
      tokenExpires: number;
    }> = {
      to: 'user@cody.inc',
      data: {
        hash: 'abc123',
        otp: '123456',
        tokenExpires: 5,
      },
    };

    await mailService.userSignUp(mailData);

    expect(mailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          logo_url: 'https://adtokart.com/adtokart_logo.png',
        }),
      }),
    );
  });

  it('should format 24:00:00 booking end times as 12:00 AM in payment status emails', async () => {
    await mailService.sendBookingPaymentStatusEmail({
      to: 'guest@cody.inc',
      data: {
        recipientName: 'Leonidas Sparta',
        emailTitle: 'Booking Awaiting Payment Confirmation - BK-20260313-1175',
        emailIntro:
          'Your payment was received and is awaiting confirmation from the merchant.',
        bookingNumber: 'BK-20260313-1175',
        bookingNumbers: ['BK-20260313-1175'],
        guestName: 'Leonidas Sparta',
        guestEmail: 'guest@cody.inc',
        serviceTitle: 'Pickleball Court 1',
        sellerName: 'Ulrak Pickle Ball Hub',
        scheduledDate: '2026-03-13',
        scheduledStartTime: '23:00:00',
        scheduledEndTime: '24:00:00',
        paymentReference: 'PAY-GUEST-TEST',
        paymentNotifiedAt: '2026-03-13T09:06:00.000Z',
        paymentStatusLabel: 'Awaiting Confirmation',
        amount: 500,
        currency: 'PHP',
      },
    });

    expect(mailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          scheduledStartTime: '11:00 PM',
          scheduledEndTime: '12:00 AM',
        }),
      }),
    );
  });

  it('should hide View Booking Status CTA for general bookings', async () => {
    await mailService.sendBookingPaymentStatusEmail({
      to: 'guest@cody.inc',
      data: {
        recipientName: 'General Customer',
        emailTitle: 'Booking Request Submitted',
        emailIntro: 'your booking request has been submitted.',
        bookingNumber: 'BK-20260415-0001',
        bookingNumbers: ['BK-20260415-0001'],
        guestName: 'General Customer',
        guestEmail: 'guest@cody.inc',
        serviceTitle: 'Standard Carwash',
        sellerName: 'Zooooom Carwash',
        scheduledDate: '2026-04-15',
        scheduledStartTime: '11:42:00',
        scheduledEndTime: '12:27:00',
        paymentReference: null,
        paymentNotifiedAt: null,
        paymentStatusLabel: 'Pending',
        bookingStatusLabel: 'Pending',
        isGeneralBooking: true,
        actionUrl: '/bookings',
        ctaLabel: 'View Booking Status',
        amount: 250,
        currency: 'PHP',
      },
    });

    expect(mailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          isGeneralBooking: true,
          showActionButton: false,
          ctaLabel: 'View Booking Status',
          actionUrl: '/bookings',
        }),
      }),
    );
  });
});
