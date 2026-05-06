import { Injectable } from '@nestjs/common';
import fs from 'node:fs/promises';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import { AllConfigType } from '@/config/config.type';

@Injectable()
export class MailerService {
  private readonly transporter: nodemailer.Transporter;
  private helpersRegistered = false;
  constructor(private readonly configService: ConfigService<AllConfigType>) {
    const mailUser = configService.get('mail.user', { infer: true });
    const mailPassword = configService.get('mail.password', { infer: true });

    const ignoreTLS = configService.get('mail.ignoreTLS', { infer: true });
    const secure = configService.get('mail.secure', { infer: true });
    const requireTLS = configService.get('mail.requireTLS', { infer: true });
    const rejectUnauthorized = configService.get('mail.rejectUnauthorized', {
      infer: true,
    });

    // Timeout settings
    const connectionTimeout = configService.get('mail.connectionTimeout', {
      infer: true,
    });
    const greetingTimeout = configService.get('mail.greetingTimeout', {
      infer: true,
    });
    const socketTimeout = configService.get('mail.socketTimeout', {
      infer: true,
    });

    // Pooling settings
    const pool = configService.get('mail.pool', { infer: true });
    const maxConnections = configService.get('mail.maxConnections', {
      infer: true,
    });
    const maxMessages = configService.get('mail.maxMessages', { infer: true });

    this.transporter = nodemailer.createTransport({
      host: configService.get('mail.host', { infer: true }),
      port: configService.get('mail.port', { infer: true }),
      secure: secure,
      auth:
        mailUser && mailPassword
          ? {
              user: mailUser,
              pass: mailPassword,
            }
          : undefined,
      tls: {
        rejectUnauthorized,
      },
      // Timeout settings to prevent stuck connections
      connectionTimeout,
      greetingTimeout,
      socketTimeout,
      // Only set ignoreTLS if explicitly true, otherwise allow STARTTLS
      ...(ignoreTLS ? { ignoreTLS: true } : {}),
      // Only set requireTLS if explicitly true
      ...(requireTLS ? { requireTLS: true } : {}),
      // Pooling settings for better throughput
      ...(pool
        ? {
            pool: true,
            maxConnections,
            maxMessages,
          }
        : {}),
    });
  }

  /**
   * Verifies the SMTP connection is working.
   * Useful for health checks without blocking app startup.
   * @returns true if connection is valid, throws error otherwise
   */
  async verifyConnection(): Promise<boolean> {
    await this.transporter.verify();
    return true;
  }

  async sendMail({
    templatePath,
    context,
    ...mailOptions
  }: nodemailer.SendMailOptions & {
    templatePath: string;
    context: Record<string, unknown>;
  }): Promise<void> {
    let html: string | undefined;
    if (templatePath) {
      const template = await fs.readFile(templatePath, 'utf-8');

      /**
       * Start of HandlebarJS Helpers
       */

      if (!this.helpersRegistered) {
        // Iterate index incrementer
        Handlebars.registerHelper('increment', (value) => {
          return parseInt(value) + 1;
        });

        // Date formatter
        Handlebars.registerHelper('dateFormat', (value) => {
          return new Date(value).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
          });
        });

        /**
         * Money formatter
         * - change number format to desired locality
         */
        Handlebars.registerHelper('moneyFormat', (value: number) => {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'PHP',
          }).format(value);
        });

        this.helpersRegistered = true;
      }

      /**
       * End of HandlebarJS Helpers
       */

      html = Handlebars.compile(template)(context);
    }

    await this.transporter.sendMail({
      ...mailOptions,
      from: mailOptions.from
        ? mailOptions.from
        : `"${this.configService.get('mail.defaultName', {
            infer: true,
          })}" <${this.configService.get('mail.defaultEmail', {
            infer: true,
          })}>`,
      html: mailOptions.html ? mailOptions.html : html,
    });
  }
}
