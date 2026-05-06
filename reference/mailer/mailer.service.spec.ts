import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from './mailer.service';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import fs from 'node:fs/promises';
import Handlebars from 'handlebars';

jest.mock('node:fs/promises');
jest.mock('nodemailer');
const sendMailMock = jest.fn();
const verifyMock = jest.fn();
(nodemailer.createTransport as jest.Mock).mockReturnValue({
  sendMail: sendMailMock,
  verify: verifyMock,
});

describe('MailerService', () => {
  let mailerService: MailerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, unknown> = {
                'mail.host': 'smtp.example.com',
                'mail.port': 587,
                'mail.ignoreTLS': false,
                'mail.secure': false,
                'mail.requireTLS': true,
                'mail.rejectUnauthorized': true,
                'mail.user': 'user@example.com',
                'mail.password': 'password',
                'mail.defaultName': 'Test Sender',
                'mail.defaultEmail': 'noreply@example.com',
                'mail.connectionTimeout': 60000,
                'mail.greetingTimeout': 30000,
                'mail.socketTimeout': 60000,
                'mail.pool': false,
                'mail.maxConnections': 5,
                'mail.maxMessages': 100,
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    mailerService = module.get<MailerService>(MailerService);
  });

  it('should be defined', () => {
    expect(mailerService).toBeDefined();
  });

  it('should send an email with the provided template', async () => {
    const templateContent = 'Hello {{name}}!';
    const context = { name: 'John' };

    (fs.readFile as jest.Mock).mockResolvedValue(templateContent);
    const compiledHtml = Handlebars.compile(templateContent)(context);

    const mailOptions = {
      to: 'recipient@example.com',
      subject: 'Test Email',
      templatePath: 'path/to/template.hbs',
      context,
    };

    await mailerService.sendMail(mailOptions);

    expect(fs.readFile).toHaveBeenCalledWith('path/to/template.hbs', 'utf-8');
    expect(sendMailMock).toHaveBeenCalledWith({
      to: 'recipient@example.com',
      subject: 'Test Email',
      from: '"Test Sender" <noreply@example.com>',
      html: compiledHtml,
    });
  });

  it('should send an email without a template', async () => {
    const mailOptions = {
      to: 'recipient@example.com',
      subject: 'Test Email',
      html: '<p>Hello!</p>',
    };

    await mailerService.sendMail(mailOptions);

    expect(sendMailMock).toHaveBeenCalledWith({
      to: 'recipient@example.com',
      subject: 'Test Email',
      from: '"Test Sender" <noreply@example.com>',
      html: '<p>Hello!</p>',
    });
  });

  it('should throw an error if sending mail fails', async () => {
    sendMailMock.mockRejectedValue(new Error('Failed to send mail'));

    const mailOptions = {
      to: 'recipient@example.com',
      subject: 'Test Email',
      html: '<p>Hello!</p>',
    };

    await expect(mailerService.sendMail(mailOptions)).rejects.toThrow(
      'Failed to send mail',
    );
  });

  describe('verifyConnection', () => {
    it('should return true when SMTP connection is valid', async () => {
      verifyMock.mockResolvedValue(true);

      const result = await mailerService.verifyConnection();

      expect(result).toBe(true);
      expect(verifyMock).toHaveBeenCalled();
    });

    it('should throw an error when SMTP connection fails', async () => {
      verifyMock.mockRejectedValue(new Error('Connection failed'));

      await expect(mailerService.verifyConnection()).rejects.toThrow(
        'Connection failed',
      );
    });
  });
});
