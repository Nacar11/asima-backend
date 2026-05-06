import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nContext } from 'nestjs-i18n';
import { MailData } from './interfaces/mail-data.interface';

import { MaybeType } from '@/utils/types/maybe.type';
import { MailerService } from '@/mailer/mailer.service';
import path from 'path';
import { AllConfigType } from '@/config/config.type';
import { TransactionalStatusEnum } from '@/utils/enums/status-enum';
import { getPurchaseOrderVatDiscountTotal } from '@/utils/helpers/calculations.helper';
import { MailTemplateEnum } from '@/utils/enums/mail-template-enum';
import { NotificationTypeEnum } from '@/notifications/enums/notification-type.enum';
import { formatTimeTo12HourPresentation } from '@/bookings/utils/booking-time-presentation.util';

@Injectable()
export class MailService {
  private static readonly DEFAULT_BRAND_LOGO_URL =
    'https://adtokart.com/adtokart_logo.png';

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  private getAppName(): string {
    return this.configService.get('app.name', { infer: true }) || 'Adtokart';
  }

  private getLogoUrl(): string {
    const configuredLogoUrl = this.configService.get('mail.logoUrl', {
      infer: true,
    });
    if (
      typeof configuredLogoUrl === 'string' &&
      configuredLogoUrl.trim().length > 0
    ) {
      return configuredLogoUrl.trim();
    }

    return MailService.DEFAULT_BRAND_LOGO_URL;
  }

  private getFrontendUrl(pathname: string): string {
    const frontendDomain = this.configService.getOrThrow('app.frontendDomain', {
      infer: true,
    });
    return new URL(pathname, frontendDomain).toString();
  }

  private formatCurrency(amount: number | string | null | undefined): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(Number(amount ?? 0));
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private async sendPickleballMerchantLifecycleEmail(
    mailData: MailData<{
      subject: string;
      title: string;
      preview: string;
      lines: string[];
      ctaLabel?: string;
      ctaUrl?: string;
    }>,
  ): Promise<void> {
    const safeTitle = this.escapeHtml(mailData.data.title);
    const safeCtaLabel = mailData.data.ctaLabel
      ? this.escapeHtml(mailData.data.ctaLabel)
      : undefined;
    const safeCtaUrl = mailData.data.ctaUrl
      ? this.escapeHtml(mailData.data.ctaUrl)
      : undefined;
    const ctaHtml =
      safeCtaUrl && safeCtaLabel
        ? `<p style="margin-top: 20px;"><a href="${safeCtaUrl}" style="display: inline-block; background: #0f766e; color: #ffffff; padding: 10px 16px; border-radius: 6px; text-decoration: none; font-weight: 700;">${safeCtaLabel}</a></p>`
        : '';
    const textLines = [
      mailData.data.preview,
      '',
      ...mailData.data.lines,
      mailData.data.ctaUrl ? `Open: ${mailData.data.ctaUrl}` : '',
    ].filter(Boolean);

    await this.mailerService.sendMail({
      to: mailData.to,
      subject: mailData.data.subject,
      text: textLines.join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2 style="margin-bottom: 12px;">${safeTitle}</h2>
          ${mailData.data.lines
            .map(
              (line) =>
                `<p style="margin: 0 0 12px;">${this.escapeHtml(line)}</p>`,
            )
            .join('')}
          ${ctaHtml}
          <p style="margin-top: 24px; color: #6b7280; font-size: 12px;">${this.escapeHtml(this.getAppName())}</p>
        </div>
      `,
    });
  }

  async sendGuestBookingConfirmationEmail(
    mailData: MailData<{
      guestName: string;
      bookingNumber?: string;
      bookingNumbers?: string[];
      primaryGuestName?: string;
      primaryGuestEmail?: string;
      primaryGuestPhone?: string | null;
      additionalGuestNames?: string[];
      guestCount?: number;
      guestNamesSummary?: string | null;
      serviceTitle: string;
      sellerName: string;
      scheduledDate: string;
      scheduledStartTime: string;
      scheduledEndTime: string;
      slotDetails?: Array<{
        bookingNumber: string;
        serviceTitle: string;
        scheduledDate: string;
        scheduledStartTime: string;
        scheduledEndTime: string;
        slotCount?: number;
        status?: string;
      }>;
      bookingStatusLabel?: string;
      paymentStatusLabel?: string;
      actionUrl?: string;
      ctaLabel?: string;
      amount: number;
      currency: string;
    }>,
  ): Promise<void> {
    const i18n = I18nContext.current();
    let footer: MaybeType<string>;

    if (i18n) {
      [footer] = await Promise.all([i18n.t('notification.footer')]);
    }

    const bookingNumbers = Array.isArray(mailData.data.bookingNumbers)
      ? mailData.data.bookingNumbers.filter(Boolean)
      : [];
    const primaryBookingNumber =
      mailData.data.bookingNumber || bookingNumbers[0] || '';
    const bookingReferenceDisplay = this.resolveBookingReferenceDisplay(
      mailData.data.bookingNumber || '',
      bookingNumbers,
    );
    const formattedStartTime = this.formatTo12Hour(
      mailData.data.scheduledStartTime,
    );
    const formattedEndTime = this.formatTo12Hour(
      mailData.data.scheduledEndTime,
    );
    const normalizedSlotDetails = this.normalizeBookingEmailSlotDetails(
      mailData.data.slotDetails,
    );
    const bookingSummary = this.summarizeBookingEmailSlotDetails({
      slotDetails: normalizedSlotDetails,
      fallbackServiceTitle: mailData.data.serviceTitle,
      fallbackScheduledDate: mailData.data.scheduledDate,
      fallbackScheduledStartTime: formattedStartTime,
      fallbackScheduledEndTime: formattedEndTime,
    });

    await this.mailerService.sendMail({
      to: mailData.to,
      subject: `Booking Confirmed - ${primaryBookingNumber}`,
      text: `Your booking ${primaryBookingNumber} has been confirmed.`,
      templatePath: path.join(
        this.configService.getOrThrow('app.workingDirectory', { infer: true }),
        'src',
        'mail',
        'mail-templates',
        'booking-confirmation-guest.hbs',
      ),
      context: {
        app_name: this.configService.get('app.name', { infer: true }),
        logo_url: this.getLogoUrl(),
        domain: this.configService.getOrThrow('app.frontendDomain', {
          infer: true,
        }),
        footer,
        guestName: mailData.data.guestName,
        bookingNumber: primaryBookingNumber,
        bookingReferenceDisplay,
        primaryGuestName:
          mailData.data.primaryGuestName || mailData.data.guestName,
        primaryGuestEmail: mailData.data.primaryGuestEmail || mailData.to,
        primaryGuestPhone:
          typeof mailData.data.primaryGuestPhone === 'string' &&
          mailData.data.primaryGuestPhone.trim().length > 0
            ? mailData.data.primaryGuestPhone.trim()
            : 'N/A',
        additionalGuestNames: Array.isArray(mailData.data.additionalGuestNames)
          ? mailData.data.additionalGuestNames.filter(Boolean)
          : [],
        guestCount: Number(mailData.data.guestCount ?? 1),
        guestNamesSummary: mailData.data.guestNamesSummary || '',
        serviceTitle: mailData.data.serviceTitle,
        sellerName: mailData.data.sellerName,
        scheduledDate: mailData.data.scheduledDate,
        scheduledStartTime: formattedStartTime,
        scheduledEndTime: formattedEndTime,
        slotDetails: normalizedSlotDetails,
        hasMultipleSlotDetails: normalizedSlotDetails.length > 1,
        slotCount: bookingSummary.slotCount,
        selectedCourtsAndTimeslotSummary:
          bookingSummary.selectedCourtsAndTimeslotSummary,
        timezoneLabel: this.getBookingEmailTimezoneLabel(),
        bookingStatusLabel: mailData.data.bookingStatusLabel || 'Confirmed',
        bookingStatusBadgeStyle: this.buildStatusBadgeStyle(
          mailData.data.bookingStatusLabel || 'Confirmed',
        ),
        paymentStatusLabel: mailData.data.paymentStatusLabel || 'Paid',
        paymentStatusBadgeStyle: this.buildStatusBadgeStyle(
          mailData.data.paymentStatusLabel || 'Paid',
        ),
        actionUrl: mailData.data.actionUrl || '',
        ctaLabel: mailData.data.ctaLabel || 'View Booking Details',
        amount: Number(mailData.data.amount).toLocaleString('en-PH', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        currency: mailData.data.currency,
      },
    });
  }

  async sendBookingAwaitingConfirmationApprovalEmail(
    mailData: MailData<{
      recipientName: string;
      bookingNumber?: string;
      bookingNumbers?: string[];
      guestName: string;
      guestEmail: string;
      primaryGuestName?: string;
      primaryGuestEmail?: string;
      primaryGuestPhone?: string | null;
      additionalGuestNames?: string[];
      serviceTitle: string;
      sellerName: string;
      scheduledDate: string;
      scheduledStartTime: string;
      scheduledEndTime: string;
      slotDetails?: Array<{
        bookingNumber: string;
        serviceTitle: string;
        scheduledDate: string;
        scheduledStartTime: string;
        scheduledEndTime: string;
        slotCount?: number;
        status?: string;
      }>;
      paymentReference?: string | null;
      paymentNotifiedAt?: string | null;
      recipientRole?: 'customer' | 'merchant';
      requiresAction?: boolean;
      bookingStatusLabel?: string;
      paymentStatusLabel?: string;
      actionUrl?: string;
      ctaLabel?: string;
      amount: number;
      currency: string;
    }>,
  ): Promise<void> {
    const i18n = I18nContext.current();
    let footer: MaybeType<string>;

    if (i18n) {
      [footer] = await Promise.all([i18n.t('notification.footer')]);
    }

    const bookingNumbers = Array.isArray(mailData.data.bookingNumbers)
      ? mailData.data.bookingNumbers.filter(Boolean)
      : [];
    const primaryBookingNumber =
      mailData.data.bookingNumber || bookingNumbers[0] || '';
    const bookingReferenceDisplay = this.resolveBookingReferenceDisplay(
      mailData.data.bookingNumber || '',
      bookingNumbers,
    );
    const formattedStartTime = this.formatTo12Hour(
      mailData.data.scheduledStartTime,
    );
    const formattedEndTime = this.formatTo12Hour(
      mailData.data.scheduledEndTime,
    );
    const formattedScheduledDate = this.formatLongDate(
      mailData.data.scheduledDate,
    );
    const formattedPaymentNotifiedAt = this.formatLongDateTime(
      mailData.data.paymentNotifiedAt || '',
    );
    const normalizedSlotDetails = this.normalizeBookingEmailSlotDetails(
      mailData.data.slotDetails,
    );
    const bookingSummary = this.summarizeBookingEmailSlotDetails({
      slotDetails: normalizedSlotDetails,
      fallbackServiceTitle: mailData.data.serviceTitle,
      fallbackScheduledDate: formattedScheduledDate,
      fallbackScheduledStartTime: formattedStartTime,
      fallbackScheduledEndTime: formattedEndTime,
    });
    const isMerchantRecipient = mailData.data.recipientRole === 'merchant';

    await this.mailerService.sendMail({
      to: mailData.to,
      subject: `Booking Awaiting Payment Confirmation - ${primaryBookingNumber}`,
      text: `Booking ${primaryBookingNumber} is awaiting payment confirmation.`,
      templatePath: path.join(
        this.configService.getOrThrow('app.workingDirectory', { infer: true }),
        'src',
        'mail',
        'mail-templates',
        'booking-awaiting-confirmation-approval.hbs',
      ),
      context: {
        app_name: this.configService.get('app.name', { infer: true }),
        logo_url: this.getLogoUrl(),
        domain: this.configService.getOrThrow('app.frontendDomain', {
          infer: true,
        }),
        footer,
        recipientName: mailData.data.recipientName,
        bookingNumber: primaryBookingNumber,
        bookingReferenceDisplay,
        isMerchantRecipient,
        isCustomerRecipient: !isMerchantRecipient,
        requiresAction: Boolean(mailData.data.requiresAction),
        guestName: mailData.data.guestName,
        guestEmail: mailData.data.guestEmail,
        serviceTitle: mailData.data.serviceTitle,
        sellerName: mailData.data.sellerName,
        scheduledDate: formattedScheduledDate,
        scheduledStartTime: formattedStartTime,
        scheduledEndTime: formattedEndTime,
        slotDetails: normalizedSlotDetails,
        hasMultipleSlotDetails: normalizedSlotDetails.length > 1,
        slotCount: bookingSummary.slotCount,
        selectedCourtsAndTimeslotSummary:
          bookingSummary.selectedCourtsAndTimeslotSummary,
        timezoneLabel: this.getBookingEmailTimezoneLabel(),
        bookingStatusLabel:
          mailData.data.bookingStatusLabel || 'Awaiting Confirmation',
        bookingStatusBadgeStyle: this.buildStatusBadgeStyle(
          mailData.data.bookingStatusLabel || 'Awaiting Confirmation',
        ),
        paymentReference: mailData.data.paymentReference || '-',
        paymentNotifiedAt: formattedPaymentNotifiedAt,
        paymentStatusLabel:
          mailData.data.paymentStatusLabel || 'Awaiting Confirmation',
        paymentStatusBadgeStyle: this.buildStatusBadgeStyle(
          mailData.data.paymentStatusLabel || 'Awaiting Confirmation',
        ),
        actionUrl: mailData.data.actionUrl || '',
        ctaLabel: mailData.data.ctaLabel || 'Review Booking Payment',
        amount: Number(mailData.data.amount).toLocaleString('en-PH', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        currency: mailData.data.currency || 'PHP',
      },
    });
  }

  async sendBookingPaymentStatusEmail(
    mailData: MailData<{
      recipientName: string;
      emailTitle: string;
      emailIntro: string;
      bookingNumber?: string;
      bookingNumbers?: string[];
      guestName: string;
      guestEmail: string;
      primaryGuestName?: string;
      primaryGuestEmail?: string;
      primaryGuestPhone?: string | null;
      additionalGuestNames?: string[];
      serviceTitle: string;
      sellerName: string;
      scheduledDate: string;
      scheduledStartTime: string;
      scheduledEndTime: string;
      slotDetails?: Array<{
        bookingNumber: string;
        serviceTitle: string;
        scheduledDate: string;
        scheduledStartTime: string;
        scheduledEndTime: string;
        slotCount?: number;
        status?: string;
      }>;
      paymentReference?: string | null;
      paymentNotifiedAt?: string | null;
      paymentStatusLabel?: string;
      bookingStatusLabel?: string;
      recipientRole?: 'customer' | 'merchant';
      isGeneralBooking?: boolean;
      isQrPayment?: boolean;
      isFullyCovered?: boolean;
      sellerContact?: string | null;
      sellerEmail?: string | null;
      requiresAction?: boolean;
      rejectionReason?: string | null;
      actionUrl?: string;
      ctaLabel?: string;
      amount: number;
      currency: string;
      vouchersApplied?: Array<{
        voucher_code: string;
        voucher_discount: number;
      }>;
      orderSubtotal?: number | null;
      orderTotalAmount?: number | null;
      serviceAmount?: number | null;
      addOnsTotal?: number | null;
      addOns?: Array<{ name: string; amount: number }>;
      optionsTotal?: number | null;
      options?: Array<{ label: string; adjustment: number }>;
    }>,
  ): Promise<void> {
    const i18n = I18nContext.current();
    let footer: MaybeType<string>;

    if (i18n) {
      [footer] = await Promise.all([i18n.t('notification.footer')]);
    }

    const bookingNumbers = Array.isArray(mailData.data.bookingNumbers)
      ? mailData.data.bookingNumbers.filter(Boolean)
      : [];
    const primaryBookingNumber =
      mailData.data.bookingNumber || bookingNumbers[0] || '';
    const bookingReferenceDisplay = this.resolveBookingReferenceDisplay(
      mailData.data.bookingNumber || '',
      bookingNumbers,
    );
    const formattedStartTime = this.formatTo12Hour(
      mailData.data.scheduledStartTime,
    );
    const formattedEndTime = this.formatTo12Hour(
      mailData.data.scheduledEndTime,
    );
    const formattedScheduledDate = this.formatLongDate(
      mailData.data.scheduledDate,
    );
    const formattedPaymentNotifiedAt = this.formatLongDateTime(
      mailData.data.paymentNotifiedAt || '',
    );
    const normalizedSlotDetails = this.normalizeBookingEmailSlotDetails(
      mailData.data.slotDetails,
    );
    const bookingSummary = this.summarizeBookingEmailSlotDetails({
      slotDetails: normalizedSlotDetails,
      fallbackServiceTitle: mailData.data.serviceTitle,
      fallbackScheduledDate: formattedScheduledDate,
      fallbackScheduledStartTime: formattedStartTime,
      fallbackScheduledEndTime: formattedEndTime,
    });
    const isMerchantRecipient = mailData.data.recipientRole === 'merchant';
    const bookingStatusLabel =
      mailData.data.bookingStatusLabel ||
      mailData.data.paymentStatusLabel ||
      'N/A';
    const paymentStatusLabel = mailData.data.paymentStatusLabel || 'N/A';
    const actionUrl = String(mailData.data.actionUrl || '').trim();
    const ctaLabel = String(mailData.data.ctaLabel || 'View Booking Details');
    const isGeneralBooking = Boolean(mailData.data.isGeneralBooking);
    const showActionButton =
      Boolean(actionUrl) && (!isGeneralBooking || isMerchantRecipient);

    await this.mailerService.sendMail({
      to: mailData.to,
      subject: `${mailData.data.emailTitle} - ${primaryBookingNumber}`,
      text: `${mailData.data.emailTitle}: booking ${primaryBookingNumber}`,
      templatePath: path.join(
        this.configService.getOrThrow('app.workingDirectory', { infer: true }),
        'src',
        'mail',
        'mail-templates',
        'booking-payment-status.hbs',
      ),
      context: {
        app_name: this.configService.get('app.name', { infer: true }),
        logo_url: this.getLogoUrl(),
        domain: this.configService.getOrThrow('app.frontendDomain', {
          infer: true,
        }),
        footer,
        recipientName: mailData.data.recipientName,
        isMerchantRecipient,
        isCustomerRecipient: !isMerchantRecipient,
        isGeneralBooking,
        isQrPayment: Boolean(mailData.data.isQrPayment),
        sellerContact: mailData.data.sellerContact || null,
        sellerEmail: mailData.data.sellerEmail || null,
        showActionButton,
        requiresAction: Boolean(mailData.data.requiresAction),
        emailTitle: mailData.data.emailTitle,
        emailIntro: mailData.data.emailIntro,
        bookingNumber: primaryBookingNumber,
        bookingReferenceDisplay,
        slotCount: bookingSummary.slotCount,
        selectedCourtsAndTimeslotSummary:
          bookingSummary.selectedCourtsAndTimeslotSummary,
        timezoneLabel: this.getBookingEmailTimezoneLabel(),
        bookingStatusLabel,
        bookingStatusBadgeStyle: this.buildStatusBadgeStyle(bookingStatusLabel),
        guestName: mailData.data.guestName,
        guestEmail: mailData.data.guestEmail,
        primaryGuestName:
          mailData.data.primaryGuestName || mailData.data.guestName,
        primaryGuestEmail:
          mailData.data.primaryGuestEmail || mailData.data.guestEmail,
        primaryGuestPhone:
          typeof mailData.data.primaryGuestPhone === 'string' &&
          mailData.data.primaryGuestPhone.trim().length > 0
            ? mailData.data.primaryGuestPhone.trim()
            : 'N/A',
        additionalGuestNames: Array.isArray(mailData.data.additionalGuestNames)
          ? mailData.data.additionalGuestNames.filter(Boolean)
          : [],
        serviceTitle: mailData.data.serviceTitle,
        sellerName: mailData.data.sellerName,
        scheduledDate: formattedScheduledDate,
        scheduledStartTime: formattedStartTime,
        scheduledEndTime: formattedEndTime,
        slotDetails: normalizedSlotDetails,
        hasMultipleSlotDetails: normalizedSlotDetails.length > 1,
        isFullyCovered: Boolean(mailData.data.isFullyCovered),
        paymentReference: mailData.data.paymentReference || 'Not yet available',
        paymentNotifiedAt:
          formattedPaymentNotifiedAt && formattedPaymentNotifiedAt !== '-'
            ? formattedPaymentNotifiedAt
            : 'Not yet available',
        paymentStatusLabel,
        paymentStatusBadgeStyle: this.buildStatusBadgeStyle(paymentStatusLabel),
        rejectionReason: mailData.data.rejectionReason || '',
        actionUrl,
        ctaLabel,
        amount: Number(mailData.data.amount).toLocaleString('en-PH', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        currency: mailData.data.currency || 'PHP',
        hasVouchersApplied:
          Array.isArray(mailData.data.vouchersApplied) &&
          mailData.data.vouchersApplied.length > 0,
        vouchersApplied: (mailData.data.vouchersApplied || []).map((v) => ({
          voucher_code: v.voucher_code,
          voucher_discount: Number(v.voucher_discount).toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
        })),
        orderSubtotal:
          mailData.data.orderSubtotal != null
            ? Number(mailData.data.orderSubtotal).toLocaleString('en-PH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : null,
        orderTotalAmount:
          mailData.data.orderTotalAmount != null
            ? Number(mailData.data.orderTotalAmount).toLocaleString('en-PH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : null,
        hasGeneralPricingBreakdown:
          isGeneralBooking && mailData.data.serviceAmount !== undefined,
        vouchersTotal: (mailData.data.vouchersApplied || [])
          .reduce((sum, v) => sum + Number(v.voucher_discount), 0)
          .toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
        serviceAmount: Number(mailData.data.serviceAmount ?? 0).toLocaleString(
          'en-PH',
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          },
        ),
        addOnsTotal: Number(mailData.data.addOnsTotal ?? 0).toLocaleString(
          'en-PH',
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          },
        ),
        hasAddOns:
          Array.isArray(mailData.data.addOns) &&
          mailData.data.addOns.length > 0,
        addOns: (mailData.data.addOns || []).map((a) => ({
          name: a.name,
          amount: Number(a.amount).toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
        })),
        optionsTotal: Number(mailData.data.optionsTotal ?? 0).toLocaleString(
          'en-PH',
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          },
        ),
        hasOptions:
          Array.isArray(mailData.data.options) &&
          mailData.data.options.length > 0,
        options: (mailData.data.options || []).map((o) => ({
          label: o.label,
          adjustment: Number(o.adjustment).toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
          isPositive: Number(o.adjustment) >= 0,
        })),
      },
    });
  }

  async sendBookingRescheduledEmail(
    mailData: MailData<{
      recipientName: string;
      bookingNumber: string;
      serviceTitle: string;
      sellerName: string;
      customerName?: string;
      customerEmail?: string | null;
      guestCount?: number;
      oldScheduledDate: string;
      oldScheduledStartTime: string;
      oldScheduledEndTime: string;
      newScheduledDate: string;
      newScheduledStartTime: string;
      newScheduledEndTime: string;
      actorName: string;
      actorRole: string;
      recipientRole?: 'customer' | 'merchant';
      actionUrl?: string;
      ctaLabel?: string;
      reason?: string;
    }>,
  ): Promise<void> {
    const i18n = I18nContext.current();
    let footer: MaybeType<string>;

    if (i18n) {
      [footer] = await Promise.all([i18n.t('notification.footer')]);
    }
    const isMerchantRecipient = mailData.data.recipientRole === 'merchant';

    await this.mailerService.sendMail({
      to: mailData.to,
      subject: `Booking Rescheduled - ${mailData.data.bookingNumber}`,
      text: `Booking ${mailData.data.bookingNumber} has been rescheduled.`,
      templatePath: path.join(
        this.configService.getOrThrow('app.workingDirectory', { infer: true }),
        'src',
        'mail',
        'mail-templates',
        'booking-rescheduled.hbs',
      ),
      context: {
        app_name: this.configService.get('app.name', { infer: true }),
        logo_url: this.getLogoUrl(),
        domain: this.configService.getOrThrow('app.frontendDomain', {
          infer: true,
        }),
        footer,
        recipientName: mailData.data.recipientName,
        isMerchantRecipient,
        isCustomerRecipient: !isMerchantRecipient,
        bookingNumber: mailData.data.bookingNumber,
        serviceTitle: mailData.data.serviceTitle,
        sellerName: mailData.data.sellerName,
        customerName: mailData.data.customerName || 'N/A',
        customerEmail: mailData.data.customerEmail || 'N/A',
        guestCount: Number(mailData.data.guestCount ?? 1),
        timezoneLabel: this.getBookingEmailTimezoneLabel(),
        oldScheduledDate: this.formatLongDate(mailData.data.oldScheduledDate),
        oldScheduledStartTime: this.formatTo12Hour(
          mailData.data.oldScheduledStartTime,
        ),
        oldScheduledEndTime: this.formatTo12Hour(
          mailData.data.oldScheduledEndTime,
        ),
        newScheduledDate: this.formatLongDate(mailData.data.newScheduledDate),
        newScheduledStartTime: this.formatTo12Hour(
          mailData.data.newScheduledStartTime,
        ),
        newScheduledEndTime: this.formatTo12Hour(
          mailData.data.newScheduledEndTime,
        ),
        actorName: mailData.data.actorName,
        actorRole: mailData.data.actorRole,
        reason: mailData.data.reason || '',
        actionUrl: mailData.data.actionUrl || '',
        ctaLabel: mailData.data.ctaLabel || 'View Booking Details',
      },
    });
  }

  private summarizeBookingEmailSlotDetails(input: {
    slotDetails: Array<{
      bookingNumber: string;
      serviceTitle: string;
      scheduledDate: string;
      scheduledStartTime: string;
      scheduledEndTime: string;
      slotCount?: number;
      status: string;
    }>;
    fallbackServiceTitle: string;
    fallbackScheduledDate: string;
    fallbackScheduledStartTime: string;
    fallbackScheduledEndTime: string;
  }): {
    slotCount: number;
    selectedCourtsAndTimeslotSummary: string;
  } {
    const slotDetails = Array.isArray(input.slotDetails)
      ? input.slotDetails
      : [];
    const slotCount =
      slotDetails.length > 0
        ? slotDetails.reduce((sum, slot) => {
            const normalized = Number(slot.slotCount ?? 1);
            if (!Number.isFinite(normalized) || normalized <= 0) {
              return sum + 1;
            }
            return sum + normalized;
          }, 0)
        : this.deriveSlotCountFromTimeRange(
            input.fallbackScheduledStartTime,
            input.fallbackScheduledEndTime,
          );
    const formattedItems =
      slotDetails.length > 0
        ? slotDetails.map(
            (slot) =>
              `${slot.scheduledDate} ${slot.scheduledStartTime} - ${slot.scheduledEndTime}(${slot.serviceTitle})`,
          )
        : [
            `${String(input.fallbackScheduledDate || '').trim() || 'N/A'} ${String(input.fallbackScheduledStartTime || '').trim() || 'N/A'} - ${String(input.fallbackScheduledEndTime || '').trim() || 'N/A'}(${String(input.fallbackServiceTitle || '').trim() || 'N/A'})`,
          ];

    return {
      slotCount,
      selectedCourtsAndTimeslotSummary: formattedItems.join(', '),
    };
  }

  private resolveBookingReferenceDisplay(
    primaryBookingNumber: string,
    bookingNumbers: string[],
  ): string {
    const normalizedPrimary = String(primaryBookingNumber || '').trim();
    if (normalizedPrimary.toUpperCase().startsWith('BKG-')) {
      return normalizedPrimary;
    }

    const groupedCandidate = bookingNumbers.find((value) =>
      String(value || '')
        .trim()
        .toUpperCase()
        .startsWith('BKG-'),
    );
    if (groupedCandidate) {
      return String(groupedCandidate).trim();
    }

    return normalizedPrimary || '-';
  }

  private resolveStatusBadgeTone(value: string): {
    background: string;
    border: string;
    color: string;
  } {
    const normalized = String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_');
    const map: Record<
      string,
      { background: string; border: string; color: string }
    > = {
      pending: { background: '#FFF7ED', border: '#FDBA74', color: '#9A3412' },
      processing: {
        background: '#ECFEFF',
        border: '#67E8F9',
        color: '#155E75',
      },
      awaiting_confirmation: {
        background: '#FFF7ED',
        border: '#FDBA74',
        color: '#9A3412',
      },
      awaiting_confirmation_payment: {
        background: '#FFF7ED',
        border: '#FDBA74',
        color: '#9A3412',
      },
      confirmed: {
        background: '#EFF6FF',
        border: '#93C5FD',
        color: '#1E40AF',
      },
      provider_assigned: {
        background: '#F5F3FF',
        border: '#C4B5FD',
        color: '#5B21B6',
      },
      in_progress: {
        background: '#ECFEFF',
        border: '#67E8F9',
        color: '#155E75',
      },
      paused: { background: '#FFF7ED', border: '#FDBA74', color: '#9A3412' },
      pending_review: {
        background: '#ECFEFF',
        border: '#67E8F9',
        color: '#155E75',
      },
      completed: {
        background: '#ECFDF5',
        border: '#86EFAC',
        color: '#166534',
      },
      cancelled: {
        background: '#FEF2F2',
        border: '#FCA5A5',
        color: '#991B1B',
      },
      canceled: {
        background: '#FEF2F2',
        border: '#FCA5A5',
        color: '#991B1B',
      },
      disputed: {
        background: '#FEF2F2',
        border: '#FCA5A5',
        color: '#991B1B',
      },
      reschedule_requested: {
        background: '#FFF7ED',
        border: '#FDBA74',
        color: '#9A3412',
      },
      paid: { background: '#ECFDF5', border: '#86EFAC', color: '#166534' },
      unpaid: { background: '#FEF2F2', border: '#FCA5A5', color: '#991B1B' },
      partial: { background: '#FFF7ED', border: '#FDBA74', color: '#9A3412' },
      refunded: {
        background: '#F5F3FF',
        border: '#C4B5FD',
        color: '#5B21B6',
      },
      failed: { background: '#FEF2F2', border: '#FCA5A5', color: '#991B1B' },
      rejected: {
        background: '#FEF2F2',
        border: '#FCA5A5',
        color: '#991B1B',
      },
    };

    return (
      map[normalized] || {
        background: '#F3F4F6',
        border: '#D1D5DB',
        color: '#374151',
      }
    );
  }

  private buildStatusBadgeStyle(value: string): string {
    const tone = this.resolveStatusBadgeTone(value);
    return [
      'display:inline-block',
      'padding:4px 10px',
      'border-radius:9999px',
      'border-width:1px',
      'border-style:solid',
      'font-size:12px',
      'font-weight:700',
      `background-color:${tone.background}`,
      `border-color:${tone.border}`,
      `color:${tone.color}`,
      'white-space:nowrap',
    ].join(';');
  }

  private getBookingEmailTimezoneLabel(): string {
    return 'PHT (UTC+8)';
  }

  private normalizeBookingEmailSlotDetails(
    slotDetails?: Array<{
      bookingNumber: string;
      serviceTitle: string;
      scheduledDate: string;
      scheduledStartTime: string;
      scheduledEndTime: string;
      slotCount?: number;
      status?: string;
    }>,
  ): Array<{
    bookingNumber: string;
    serviceTitle: string;
    scheduledDate: string;
    scheduledStartTime: string;
    scheduledEndTime: string;
    status: string;
    statusBadgeStyle: string;
    slotCount: number;
  }> {
    if (!Array.isArray(slotDetails)) {
      return [];
    }

    return slotDetails.map((slot) => ({
      bookingNumber: String(slot?.bookingNumber || '').trim() || '-',
      serviceTitle: String(slot?.serviceTitle || '').trim() || 'N/A',
      scheduledDate: this.formatLongDate(String(slot?.scheduledDate || '')),
      scheduledStartTime: this.formatTo12Hour(
        String(slot?.scheduledStartTime || ''),
      ),
      scheduledEndTime: this.formatTo12Hour(
        String(slot?.scheduledEndTime || ''),
      ),
      slotCount: this.resolveSlotCountForEmail(
        slot?.slotCount,
        String(slot?.scheduledStartTime || ''),
        String(slot?.scheduledEndTime || ''),
      ),
      status: this.formatStatusLabelForDisplay(String(slot?.status || '')),
      statusBadgeStyle: this.buildStatusBadgeStyle(String(slot?.status || '')),
    }));
  }

  private resolveSlotCountForEmail(
    explicitSlotCount: unknown,
    scheduledStartTime: string,
    scheduledEndTime: string,
  ): number {
    const normalizedExplicit = Number(explicitSlotCount ?? 0);
    if (Number.isFinite(normalizedExplicit) && normalizedExplicit > 0) {
      return normalizedExplicit;
    }

    return this.deriveSlotCountFromTimeRange(
      scheduledStartTime,
      scheduledEndTime,
    );
  }

  private deriveSlotCountFromTimeRange(
    scheduledStartTime: string,
    scheduledEndTime: string,
  ): number {
    const startMinutes = this.parseTimeToMinutes(scheduledStartTime);
    const endMinutes = this.parseTimeToMinutes(
      scheduledEndTime || scheduledStartTime,
    );
    if (startMinutes === null || endMinutes === null) {
      return 1;
    }

    const durationMinutes = endMinutes - startMinutes;
    if (durationMinutes <= 0) {
      return 1;
    }

    return Math.max(1, Math.ceil(durationMinutes / 60));
  }

  private parseTimeToMinutes(value: string): number | null {
    const raw = String(value || '').trim();
    if (!raw) {
      return null;
    }

    const twentyFourHourMatch = raw.match(
      /^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/,
    );
    if (twentyFourHourMatch) {
      const hours = Number(twentyFourHourMatch[1]);
      const minutes = Number(twentyFourHourMatch[2]);
      const seconds = Number(twentyFourHourMatch[3] ?? 0);
      const isValidMidnightBoundary =
        hours === 24 && minutes === 0 && seconds === 0;
      if (
        Number.isFinite(hours) &&
        Number.isFinite(minutes) &&
        Number.isFinite(seconds) &&
        hours >= 0 &&
        hours <= 24 &&
        minutes >= 0 &&
        minutes <= 59 &&
        seconds >= 0 &&
        seconds <= 59 &&
        (hours < 24 || isValidMidnightBoundary)
      ) {
        return hours * 60 + minutes + seconds / 60;
      }
      return null;
    }

    const twelveHourMatch = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!twelveHourMatch) {
      return null;
    }

    let hours = Number(twelveHourMatch[1]);
    const minutes = Number(twelveHourMatch[2]);
    const period = String(twelveHourMatch[3] || '').toUpperCase();
    if (
      !Number.isFinite(hours) ||
      !Number.isFinite(minutes) ||
      hours < 1 ||
      hours > 12 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null;
    }

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    }
    if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return hours * 60 + minutes;
  }

  private formatStatusLabelForDisplay(value: string): string {
    const normalized = String(value || '').trim();
    if (!normalized) {
      return 'N/A';
    }

    return normalized
      .split('_')
      .filter(Boolean)
      .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
      .join(' ');
  }

  private formatTo12Hour(time: string): string {
    return formatTimeTo12HourPresentation(time);
  }

  private formatLongDate(value: string): string {
    const date = new Date((value || '').trim());
    if (Number.isNaN(date.getTime())) {
      return value || '-';
    }

    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Manila',
    });
  }

  private formatLongDateTime(value: string): string {
    const date = new Date((value || '').trim());
    if (Number.isNaN(date.getTime())) {
      return value || '-';
    }

    const datePart = date.toLocaleDateString('en-US', {
      month: 'long',
      day: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Manila',
    });
    const timePart = date
      .toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Manila',
      })
      .replace(/\s/g, '');

    return `${datePart} ${timePart}`;
  }

  async userSignUp(
    mailData: MailData<{ hash: string; otp: string; tokenExpires: number }>,
  ): Promise<void> {
    const i18n = I18nContext.current();
    let emailConfirmTitle: MaybeType<string>;
    let text1: MaybeType<string>;
    let text2: MaybeType<string>;
    let text3: MaybeType<string>;

    if (i18n) {
      [emailConfirmTitle, text1, text2, text3] = await Promise.all([
        i18n.t('common.confirmEmail'),
        i18n.t('confirm-email.text1'),
        i18n.t('confirm-email.text2'),
        i18n.t('confirm-email.text3'),
      ]);
    }

    const url = new URL(
      this.configService.getOrThrow('app.frontendDomain', {
        infer: true,
      }) + '/confirm-email',
    );
    url.searchParams.set('hash', mailData.data.hash);
    url.searchParams.set('expires', mailData.data.tokenExpires.toString());

    await this.mailerService.sendMail({
      to: mailData.to,
      subject: emailConfirmTitle,
      text: `${url.toString()} ${emailConfirmTitle}. Your OTP code is: ${mailData.data.otp}`,
      templatePath: path.join(
        this.configService.getOrThrow('app.workingDirectory', {
          infer: true,
        }),
        'src',
        'mail',
        'mail-templates',
        'activation.hbs',
      ),
      context: {
        title: emailConfirmTitle,
        url: url.toString(),
        actionTitle: emailConfirmTitle,
        otp: mailData.data.otp,
        app_name: this.configService.get('app.name', { infer: true }),
        logo_url: this.getLogoUrl(),
        text1,
        text2,
        text3,
      },
    });
  }

  async storeMemberInvitation(
    mailData: MailData<{
      hash: string;
      otp: string;
      tokenExpires: number;
      memberName: string;
      inviterName: string;
      storeName: string;
    }>,
  ): Promise<void> {
    const title = `Welcome to ${mailData.data.storeName}`;

    const url = new URL(
      this.configService.getOrThrow('app.frontendDomain', {
        infer: true,
      }) + '/password-change',
    );
    url.searchParams.set('hash', mailData.data.hash);
    url.searchParams.set('expires', mailData.data.tokenExpires.toString());

    await this.mailerService.sendMail({
      to: mailData.to,
      subject: title,
      text: `${mailData.data.inviterName} has invited you to join ${mailData.data.storeName}. Set up your account: ${url.toString()}. Your OTP code is: ${mailData.data.otp}`,
      templatePath: path.join(
        this.configService.getOrThrow('app.workingDirectory', {
          infer: true,
        }),
        'src',
        'mail',
        'mail-templates',
        'store-member-invitation.hbs',
      ),
      context: {
        title,
        url: url.toString(),
        otp: mailData.data.otp,
        member_name: mailData.data.memberName,
        inviter_name: mailData.data.inviterName,
        store_name: mailData.data.storeName,
        app_name: this.configService.get('app.name', { infer: true }),
        logo_url: this.getLogoUrl(),
      },
    });
  }

  async pickleballMerchantCredentials(
    mailData: MailData<{
      merchantName: string;
      recipientRole: string;
      temporaryPassword: string;
    }>,
  ): Promise<void> {
    const loginUrl = new URL(
      this.configService.getOrThrow('app.frontendDomain', {
        infer: true,
      }) + '/en/sign-in',
    );

    const subject = `${mailData.data.merchantName} merchant account approved`;

    await this.mailerService.sendMail({
      to: mailData.to,
      subject,
      text:
        `Your ${mailData.data.recipientRole} account for ${mailData.data.merchantName} is now ready. ` +
        `Temporary password: ${mailData.data.temporaryPassword}. ` +
        `Sign in here: ${loginUrl.toString()} and change your password before continuing.`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2 style="margin-bottom: 12px;">Merchant account approved</h2>
          <p>Your <strong>${mailData.data.recipientRole}</strong> account for <strong>${mailData.data.merchantName}</strong> is now ready.</p>
          <p>Temporary password: <strong>${mailData.data.temporaryPassword}</strong></p>
          <p>Please sign in and change your password before proceeding with subscription payment and listing setup.</p>
          <p><a href="${loginUrl.toString()}">Open sign in page</a></p>
        </div>
      `,
    });
  }

  async pickleballMerchantApplicationSubmittedOwner(
    mailData: MailData<{
      merchantName: string;
      applicationNumber: string;
    }>,
  ): Promise<void> {
    await this.sendPickleballMerchantLifecycleEmail({
      to: mailData.to,
      data: {
        subject: `${mailData.data.merchantName} application received`,
        title: 'Application received',
        preview: `We received application ${mailData.data.applicationNumber}.`,
        lines: [
          `We received the independent pickleball merchant application for ${mailData.data.merchantName}.`,
          `Application number: ${mailData.data.applicationNumber}.`,
          'An admin will review the details and send the next steps once approved.',
        ],
        ctaLabel: 'Open sign in page',
        ctaUrl: this.getFrontendUrl('/en/sign-in'),
      },
    });
  }

  async pickleballMerchantApplicationSubmittedApprover(
    mailData: MailData<{
      merchantName: string;
      applicationNumber: string;
    }>,
  ): Promise<void> {
    await this.sendPickleballMerchantLifecycleEmail({
      to: mailData.to,
      data: {
        subject: `${mailData.data.merchantName} approver invitation pending`,
        title: 'Approver invitation pending',
        preview: `You were listed as approver for application ${mailData.data.applicationNumber}.`,
        lines: [
          `You were listed as the booking payment approver for ${mailData.data.merchantName}.`,
          `Application number: ${mailData.data.applicationNumber}.`,
          'If the application is approved, you will receive account credentials by email.',
        ],
      },
    });
  }

  async pickleballMerchantApplicationSubmittedAdmin(
    mailData: MailData<{
      merchantName: string;
      applicationNumber: string;
      ownerEmail: string;
      applicationId: number;
    }>,
  ): Promise<void> {
    await this.sendPickleballMerchantLifecycleEmail({
      to: mailData.to,
      data: {
        subject: `New pickleball merchant application: ${mailData.data.merchantName}`,
        title: 'New merchant application',
        preview: `${mailData.data.merchantName} is awaiting admin review.`,
        lines: [
          `${mailData.data.merchantName} submitted an independent pickleball merchant application.`,
          `Application number: ${mailData.data.applicationNumber}.`,
          `Owner email: ${mailData.data.ownerEmail}.`,
        ],
        ctaLabel: 'Review application',
        ctaUrl: this.getFrontendUrl(
          `/en/admin/pickleball-merchant-applications?applicationId=${mailData.data.applicationId}`,
        ),
      },
    });
  }

  async pickleballMerchantApplicationRejected(
    mailData: MailData<{
      merchantName: string;
      applicationNumber: string;
      rejectionReason: string;
    }>,
  ): Promise<void> {
    await this.sendPickleballMerchantLifecycleEmail({
      to: mailData.to,
      data: {
        subject: `${mailData.data.merchantName} application needs changes`,
        title: 'Application not approved',
        preview: `Application ${mailData.data.applicationNumber} was not approved.`,
        lines: [
          `The application for ${mailData.data.merchantName} was not approved.`,
          `Application number: ${mailData.data.applicationNumber}.`,
          `Reason: ${mailData.data.rejectionReason}.`,
          'You may submit a new application with corrected details.',
        ],
        ctaLabel: 'Submit a new application',
        ctaUrl: this.getFrontendUrl('/en/pickleball-merchant-apply'),
      },
    });
  }

  async pickleballMerchantSubscriptionPaymentSubmittedOwner(
    mailData: MailData<{
      merchantName: string;
      applicationNumber: string;
      paymentNumber: string;
      amount: number;
    }>,
  ): Promise<void> {
    await this.sendPickleballMerchantLifecycleEmail({
      to: mailData.to,
      data: {
        subject: `${mailData.data.merchantName} payment submitted`,
        title: 'Payment submitted',
        preview: 'Your subscription payment is awaiting admin review.',
        lines: [
          `Your subscription payment for ${mailData.data.merchantName} is now awaiting admin review.`,
          `Application number: ${mailData.data.applicationNumber}.`,
          `Payment number: ${mailData.data.paymentNumber}.`,
          `Amount: ${this.formatCurrency(mailData.data.amount)}.`,
        ],
        ctaLabel: 'View merchant onboarding',
        ctaUrl: this.getFrontendUrl('/en/seller/merchant-subscription'),
      },
    });
  }

  async pickleballMerchantSubscriptionPaymentSubmittedAdmin(
    mailData: MailData<{
      merchantName: string;
      applicationNumber: string;
      paymentNumber: string;
      amount: number;
      paymentMethod?: string | null;
      referenceNumber?: string | null;
      applicationId: number;
    }>,
  ): Promise<void> {
    await this.sendPickleballMerchantLifecycleEmail({
      to: mailData.to,
      data: {
        subject: `Payment review needed: ${mailData.data.merchantName}`,
        title: 'Subscription payment submitted',
        preview: `${mailData.data.merchantName} submitted subscription payment proof.`,
        lines: [
          `${mailData.data.merchantName} submitted subscription payment proof for admin review.`,
          `Application number: ${mailData.data.applicationNumber}.`,
          `Payment number: ${mailData.data.paymentNumber}.`,
          `Amount: ${this.formatCurrency(mailData.data.amount)}.`,
          `Method: ${mailData.data.paymentMethod || 'Not provided'}.`,
          `Reference: ${mailData.data.referenceNumber || 'Not provided'}.`,
        ],
        ctaLabel: 'Review payment',
        ctaUrl: this.getFrontendUrl(
          `/en/admin/pickleball-merchant-applications?applicationId=${mailData.data.applicationId}`,
        ),
      },
    });
  }

  async pickleballMerchantSubscriptionPaymentApproved(
    mailData: MailData<{
      merchantName: string;
      applicationNumber: string;
    }>,
  ): Promise<void> {
    await this.sendPickleballMerchantLifecycleEmail({
      to: mailData.to,
      data: {
        subject: `${mailData.data.merchantName} payment approved`,
        title: 'Payment approved',
        preview: 'Your merchant subscription payment was approved.',
        lines: [
          `The subscription payment for ${mailData.data.merchantName} was approved.`,
          `Application number: ${mailData.data.applicationNumber}.`,
          'The admin team will complete offline onboarding before your listing goes live.',
        ],
        ctaLabel: 'View merchant onboarding',
        ctaUrl: this.getFrontendUrl('/en/seller/merchant-subscription'),
      },
    });
  }

  async pickleballMerchantSubscriptionPaymentRejected(
    mailData: MailData<{
      merchantName: string;
      applicationNumber: string;
      rejectionReason: string;
    }>,
  ): Promise<void> {
    await this.sendPickleballMerchantLifecycleEmail({
      to: mailData.to,
      data: {
        subject: `${mailData.data.merchantName} payment needs review`,
        title: 'Payment not approved',
        preview: 'Your merchant subscription payment was not approved.',
        lines: [
          `The subscription payment proof for ${mailData.data.merchantName} was not approved.`,
          `Application number: ${mailData.data.applicationNumber}.`,
          `Reason: ${mailData.data.rejectionReason}.`,
          'Please submit corrected payment proof from the merchant onboarding page.',
        ],
        ctaLabel: 'Resubmit payment',
        ctaUrl: this.getFrontendUrl('/en/seller/merchant-subscription'),
      },
    });
  }

  async pickleballMerchantListingPublished(
    mailData: MailData<{
      merchantName: string;
      applicationNumber: string;
    }>,
  ): Promise<void> {
    await this.sendPickleballMerchantLifecycleEmail({
      to: mailData.to,
      data: {
        subject: `${mailData.data.merchantName} listing is live`,
        title: 'Listing is live',
        preview: `${mailData.data.merchantName} is now public on pickleball selection.`,
        lines: [
          `${mailData.data.merchantName} is now live on the public pickleball selection page.`,
          `Application number: ${mailData.data.applicationNumber}.`,
          'Players can discover and book the active court services once availability is configured.',
        ],
        ctaLabel: 'Open pickleball selection',
        ctaUrl: this.getFrontendUrl('/en/pickleball-selection'),
      },
    });
  }

  async forgotPassword(
    mailData: MailData<{ hash: string; otp: string; tokenExpires: number }>,
  ): Promise<void> {
    const i18n = I18nContext.current();
    let resetPasswordTitle: MaybeType<string>;
    let text1: MaybeType<string>;
    let text2: MaybeType<string>;
    let text3: MaybeType<string>;
    let text4: MaybeType<string>;

    if (i18n) {
      [resetPasswordTitle, text1, text2, text3, text4] = await Promise.all([
        i18n.t('common.resetPassword'),
        i18n.t('reset-password.text1'),
        i18n.t('reset-password.text2'),
        i18n.t('reset-password.text3'),
        i18n.t('reset-password.text4'),
      ]);
    }

    const url = new URL(
      this.configService.getOrThrow('app.frontendDomain', {
        infer: true,
      }) + '/password-change',
    );
    url.searchParams.set('hash', mailData.data.hash);
    url.searchParams.set('expires', mailData.data.tokenExpires.toString());

    await this.mailerService.sendMail({
      to: mailData.to,
      subject: resetPasswordTitle,
      text: `${url.toString()} ${resetPasswordTitle}. Your OTP code is: ${mailData.data.otp}`,
      templatePath: path.join(
        this.configService.getOrThrow('app.workingDirectory', {
          infer: true,
        }),
        'src',
        'mail',
        'mail-templates',
        'reset-password.hbs',
      ),
      context: {
        title: resetPasswordTitle,
        url: url.toString(),
        actionTitle: resetPasswordTitle,
        otp: mailData.data.otp,
        app_name: this.configService.get('app.name', {
          infer: true,
        }),
        logo_url: this.getLogoUrl(),
        text1,
        text2,
        text3,
        text4,
      },
    });
  }

  async resendOtp(
    mailData: MailData<{ otp: string; tokenExpires: number }>,
  ): Promise<void> {
    const i18n = I18nContext.current();
    let resetPasswordTitle: MaybeType<string>;
    let text1: MaybeType<string>;
    let text2: MaybeType<string>;
    let text3: MaybeType<string>;
    let text4: MaybeType<string>;

    if (i18n) {
      [resetPasswordTitle, text1, text2, text3, text4] = await Promise.all([
        i18n.t('common.resetPassword'),
        i18n.t('reset-password.text1'),
        i18n.t('reset-password.text2'),
        i18n.t('reset-password.text3'),
        i18n.t('reset-password.text4'),
      ]);
    }

    await this.mailerService.sendMail({
      to: mailData.to,
      subject: `${resetPasswordTitle} - New OTP`,
      text: `Your new OTP code is: ${mailData.data.otp}`,
      templatePath: path.join(
        this.configService.getOrThrow('app.workingDirectory', {
          infer: true,
        }),
        'src',
        'mail',
        'mail-templates',
        'reset-password.hbs',
      ),
      context: {
        title: `${resetPasswordTitle} - New OTP`,
        url: '', // Empty URL since this is just a resend
        actionTitle: `${resetPasswordTitle}`,
        otp: mailData.data.otp,
        app_name: this.configService.get('app.name', {
          infer: true,
        }),
        logo_url: this.getLogoUrl(),
        text1,
        text2,
        text3,
        text4,
        isResend: true,
      },
    });
  }

  async resendConfirmationOtp(
    mailData: MailData<{ otp: string; tokenExpires: number }>,
  ): Promise<void> {
    const i18n = I18nContext.current();
    let emailConfirmTitle: MaybeType<string>;
    let text1: MaybeType<string>;
    let text2: MaybeType<string>;
    let text3: MaybeType<string>;
    let text4: MaybeType<string>;

    if (i18n) {
      [emailConfirmTitle, text1, text2, text3, text4] = await Promise.all([
        i18n.t('common.confirmEmail'),
        i18n.t('confirm-email.text1'),
        i18n.t('confirm-email.text2'),
        i18n.t('confirm-email.text3'),
        i18n.t('confirm-email.text4'),
      ]);
    }

    await this.mailerService.sendMail({
      to: mailData.to,
      subject: `${emailConfirmTitle} - New OTP`,
      text: `Your new OTP code is: ${mailData.data.otp}`,
      templatePath: path.join(
        this.configService.getOrThrow('app.workingDirectory', {
          infer: true,
        }),
        'src',
        'mail',
        'mail-templates',
        'activation.hbs',
      ),
      context: {
        title: `${emailConfirmTitle} - New OTP`,
        url: '', // Empty URL since this is just a resend
        actionTitle: `${emailConfirmTitle}`,
        otp: mailData.data.otp,
        app_name: this.configService.get('app.name', {
          infer: true,
        }),
        logo_url: this.getLogoUrl(),
        text1,
        text2,
        text3,
        text4,
        isResend: true,
      },
    });
  }

  async confirmNewEmail(mailData: MailData<{ hash: string }>): Promise<void> {
    const i18n = I18nContext.current();
    let emailConfirmTitle: MaybeType<string>;
    let text1: MaybeType<string>;
    let text2: MaybeType<string>;
    let text3: MaybeType<string>;

    if (i18n) {
      [emailConfirmTitle, text1, text2, text3] = await Promise.all([
        i18n.t('common.confirmEmail'),
        i18n.t('confirm-new-email.text1'),
        i18n.t('confirm-new-email.text2'),
        i18n.t('confirm-new-email.text3'),
      ]);
    }

    const url = new URL(
      this.configService.getOrThrow('app.frontendDomain', {
        infer: true,
      }) + '/confirm-new-email',
    );
    url.searchParams.set('hash', mailData.data.hash);

    await this.mailerService.sendMail({
      to: mailData.to,
      subject: emailConfirmTitle,
      text: `${url.toString()} ${emailConfirmTitle}`,
      templatePath: path.join(
        this.configService.getOrThrow('app.workingDirectory', {
          infer: true,
        }),
        'src',
        'mail',
        'mail-templates',
        'confirm-new-email.hbs',
      ),
      context: {
        title: emailConfirmTitle,
        url: url.toString(),
        actionTitle: emailConfirmTitle,
        app_name: this.configService.get('app.name', { infer: true }),
        logo_url: this.getLogoUrl(),
        text1,
        text2,
        text3,
      },
    });
  }

  async sendEmailChangeOtp(
    mailData: MailData<{ otp: string; newEmail: string; tokenExpires: number }>,
  ): Promise<void> {
    const i18n = I18nContext.current();
    let emailChangeTitle: MaybeType<string>;
    let text1: MaybeType<string>;
    let text2: MaybeType<string>;
    let text3: MaybeType<string>;
    let text4: MaybeType<string>;

    if (i18n) {
      [emailChangeTitle, text1, text2, text3, text4] = await Promise.all([
        i18n.t('common.changeEmail'),
        i18n.t('change-email.text1'),
        i18n.t('change-email.text2'),
        i18n.t('change-email.text3'),
        i18n.t('change-email.text4'),
      ]);
    }

    // Fallback titles if i18n not available
    emailChangeTitle = emailChangeTitle || 'Email Update Verification';
    text1 =
      text1 ||
      'We received a request to update the email address associated with your account.';
    text2 =
      text2 ||
      'Please enter the verification code below to confirm this change.';
    text3 = text3 || 'This code will expire in 15 minutes.';
    text4 =
      text4 ||
      'If you did not request this change, please disregard this email. Your account remains secure.';

    await this.mailerService.sendMail({
      to: mailData.data.newEmail,
      subject: emailChangeTitle,
      text: `Your email change verification code is: ${mailData.data.otp}`,
      templatePath: path.join(
        this.configService.getOrThrow('app.workingDirectory', {
          infer: true,
        }),
        'src',
        'mail',
        'mail-templates',
        'email-change-otp.hbs',
      ),
      context: {
        title: emailChangeTitle,
        otp: mailData.data.otp,
        newEmail: mailData.data.newEmail,
        app_name: this.configService.get('app.name', { infer: true }),
        logo_url: this.getLogoUrl(),
        text1,
        text2,
        text3,
        text4,
      },
    });
  }

  async resendEmailChangeOtp(
    mailData: MailData<{ otp: string; tokenExpires: number }>,
  ): Promise<void> {
    const i18n = I18nContext.current();
    let emailChangeTitle: MaybeType<string>;
    let text1: MaybeType<string>;
    let text2: MaybeType<string>;
    let text3: MaybeType<string>;
    let text4: MaybeType<string>;

    if (i18n) {
      [emailChangeTitle, text1, text2, text3, text4] = await Promise.all([
        i18n.t('common.changeEmail'),
        i18n.t('change-email.text1'),
        i18n.t('change-email.text2'),
        i18n.t('change-email.text3'),
        i18n.t('change-email.text4'),
      ]);
    }

    // Fallback titles if i18n not available
    emailChangeTitle = emailChangeTitle || 'Email Update Verification';
    text1 =
      text1 ||
      'We received a request to update the email address associated with your account.';
    text2 =
      text2 ||
      'Please enter the verification code below to confirm this change.';
    text3 = text3 || 'This code will expire in 15 minutes.';
    text4 =
      text4 ||
      'If you did not request this change, please disregard this email. Your account remains secure.';

    await this.mailerService.sendMail({
      to: mailData.to,
      subject: `${emailChangeTitle} - New OTP`,
      text: `Your new email change verification code is: ${mailData.data.otp}`,
      templatePath: path.join(
        this.configService.getOrThrow('app.workingDirectory', {
          infer: true,
        }),
        'src',
        'mail',
        'mail-templates',
        'email-change-otp.hbs',
      ),
      context: {
        title: `${emailChangeTitle} - New OTP`,
        otp: mailData.data.otp,
        app_name: this.configService.get('app.name', { infer: true }),
        logo_url: this.getLogoUrl(),
        text1,
        text2,
        text3,
        text4,
        isResend: true,
      },
    });
  }

  /**
   * Transactional Mail sender
   * @param mailData - purchase order / purchase request data
   * @param template - enum flag to dynamically render email template
   * @param status - purchase order status
   */
  async transactionMailSender(
    mailData: MailData<{
      hash?: string;
      content?: any;
    }>,
    template: MailTemplateEnum = MailTemplateEnum.PO,
    status?: TransactionalStatusEnum,
  ): Promise<void> {
    try {
      let mailerData = {};
      // mail builder switcher based on template variable
      switch (template) {
        case MailTemplateEnum.PO:
          mailerData = await this.purchaseOrderMailBuilder(
            mailData,
            template,
            status,
          );
          break;
        case MailTemplateEnum.POS:
          mailerData = await this.purchaseOrderSupplierMailBuilder(
            mailData,
            template,
          );
          break;
        case MailTemplateEnum.PR:
          /**
           * TODO:
           * Create a function for Purchase request mail builder
           */
          break;
      }
      await this.mailerService.sendMail(mailerData);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Purchase Order Supplier Mail builder
   * @param mailData - Purchase Order data
   * @param template - enum value of "Purchase Order" | "Purchase Order Supplier" | "Purchase Request"
   * @returns transformed data for mailer consumption
   */
  private async purchaseOrderSupplierMailBuilder(
    mailData: MailData<{
      hash?: string;
      content?: any;
    }>,
    template: MailTemplateEnum.POS,
  ) {
    const i18n = I18nContext.current();
    let title: MaybeType<string>;
    let attention: MaybeType<string>;
    let salutation: MaybeType<string>;
    let intro1: MaybeType<string>;
    let intro2: MaybeType<string>;
    let closing: MaybeType<string>;
    let signOff: MaybeType<string>;

    if (i18n) {
      const jsonTemplateText = [
        i18n.t('purchase-order-supplier.title'),
        i18n.t('purchase-order-supplier.attention'),
        i18n.t('purchase-order-supplier.salutation'),
        i18n.t('purchase-order-supplier.intro1'),
        i18n.t('purchase-order-supplier.intro2'),
        i18n.t('purchase-order-supplier.closing'),
        i18n.t('purchase-order-supplier.signOff'),
      ];
      [title, attention, salutation, intro1, intro2, closing, signOff] =
        await Promise.all(jsonTemplateText);
    }

    let data = {};
    const contextData = {};
    const mailerData = {};
    if (mailData.data?.content && template === MailTemplateEnum.POS) {
      data = mailData.data?.content;

      contextData['data'] = data;
      contextData['control_no'] = data['control_no'];
      contextData['supplier_code'] = data['supplier']['code'];
      contextData['supplier_name'] = data['supplier']['name'];

      contextData['purchaseOrderSummary'] =
        getPurchaseOrderVatDiscountTotal(data);
    }

    const creator = data['created_by']['email'];
    const endorser = data['endorsed_by']['email'];
    const reviewer = data['reviewed_by']['email'];
    const approver = data['approved_by']['email'];
    const supplier = data['supplier']['email'];

    // assign email title
    contextData['title'] = title?.replace('{control_no}', data['control_no']);
    // assign email attention
    contextData['attention'] = attention?.replace(
      '{supplier}',
      contextData['supplier_name'],
    );
    // assign email salutation
    contextData['salutation'] = salutation?.replace(
      '{recipient}',
      `${contextData['supplier_name']}`,
    );
    // assign email recipient
    mailerData['to'] = supplier;
    mailerData['cc'] = [endorser, reviewer, approver, creator];
    mailerData['subject'] = contextData['title'];
    mailerData['text'] = contextData['title'];

    // mailer template
    mailerData['templatePath'] = path.join(
      this.configService.getOrThrow('app.workingDirectory', {
        infer: true,
      }),
      'src',
      'mail',
      'mail-templates',
      'purchase-order-supplier.hbs',
    );

    // mailer content
    mailerData['context'] = {
      domain: this.configService.getOrThrow('app.frontendDomain', {
        infer: true,
      }),
      title: contextData['title'],
      // ctaApprove: `this is a testing approve URL`,
      // ctaDisapprove: `this is a testing disapprove URL`,
      app_name: this.configService.get('app.name', { infer: true }),
      logo_url: this.getLogoUrl(),
      intro1,
      intro2,
      closing,
      signOff,
      ...contextData,
    };

    if (mailData.data?.content.attachments) {
      contextData['attachments'] = mailData.data?.content.attachments;
      mailerData['attachments'] = mailData.data?.content.attachments.map(
        (file) => ({
          filename: file.file_name,
          content: Buffer.from(file.base64Data, 'base64'),
        }),
      );
    }
    return mailerData;
  }

  /**
   * Purchase Order Mail builder
   * @param mailData - Purchase Order data
   * @param template - enum value of "Purchase Order" | "Purchase Order Supplier" | "Purchase Request"
   * @param status - string value of transaction status
   * @returns transformed data for mailer consumption
   */
  private async purchaseOrderMailBuilder(
    mailData: MailData<{
      hash?: string;
      content?: any;
    }>,
    template: MailTemplateEnum,
    status?: TransactionalStatusEnum | undefined,
  ) {
    const i18n = I18nContext.current();
    let title: MaybeType<string>;
    let salutation: MaybeType<string>;
    let body1: MaybeType<string>;
    let body2: MaybeType<string>;
    let body3: MaybeType<string>;
    let body4: MaybeType<string>;
    let body5: MaybeType<string>;

    if (i18n) {
      /**
       * TODO:
       * create a conditional statement to replace translatable static json text
       * condition if Purchase Order or Purchase Request should be used
       */
      const jsonTemplateText = [
        i18n.t('purchase-order.title'),
        i18n.t('purchase-order.salutation'),
        i18n.t('purchase-order.body1'),
        i18n.t('purchase-order.body2'),
        i18n.t('purchase-order.body3'),
        i18n.t('purchase-order.body4'),
        i18n.t('purchase-order.body5'),
      ];
      [title, salutation, body1, body2, body3, body4, body5] =
        await Promise.all(jsonTemplateText);
    }

    let data = {};
    const contextData = {};
    const mailerData = {};
    if (mailData.data?.content && template === MailTemplateEnum.PO) {
      data = mailData.data?.content;

      contextData['data'] = data;
      contextData['control_no'] = data['control_no'];
      contextData['po_date'] = data['po_date'];
      contextData['supplier_code'] = data['supplier']['code'];
      contextData['supplier_name'] = data['supplier']['name'];

      contextData['purchaseOrderSummary'] =
        getPurchaseOrderVatDiscountTotal(data);
    }

    const creator = data['created_by']['email'];
    const endorser = data['endorsed_by']['email'];
    const reviewer = data['reviewed_by']['email'];
    const approver = data['approved_by']['email'];

    switch (status) {
      case TransactionalStatusEnum.ENDORSED:
        contextData['status'] = TransactionalStatusEnum.ENDORSED;
        // assign email body message
        contextData['bodyMessage'] = body1?.replace(
          '{user}',
          `${contextData['data'].endorsed_by?.first_name} ${contextData['data'].endorsed_by?.last_name}`,
        );
        // assign email salutation
        contextData['salutation'] = salutation?.replace(
          '{recipient}',
          `${contextData['data'].reviewed_by?.first_name} ${contextData['data'].reviewed_by?.last_name}`,
        );
        // assign email title
        title = title?.replace('For {action}', 'Endorsed');
        contextData['title'] = title?.replace(
          '{control_no}',
          data['control_no'],
        );
        // assign email recipient
        mailerData['to'] = reviewer;
        break;

      case TransactionalStatusEnum.DISAPPROVED:
        contextData['status'] = TransactionalStatusEnum.DISAPPROVED;
        // assign email body message
        contextData['bodyMessage'] = body2?.replace(
          '{user}',
          "reviewer's full name",
        );
        // assign email salutation
        contextData['salutation'] = salutation?.replace(
          '{recipient}',
          `${contextData['data'].created_by?.first_name} ${contextData['data'].created_by?.last_name}`,
        );
        // assign email title
        title = title?.replace('{action}', 'Disapproved');
        contextData['title'] = title?.replace(
          '{control_no}',
          data['control_no'],
        );
        // assign email recipient
        mailerData['to'] = creator;
        /*
         * TODO:
         * assign email recipient
         * this will cause an error since no recipient assigned
         */
        break;

      case TransactionalStatusEnum.REVIEWED:
        contextData['status'] = TransactionalStatusEnum.REVIEWED;
        // assign email body message
        contextData['bodyMessage'] = body3?.replace(
          '{user}',
          `${contextData['data'].reviewed_by?.first_name} ${contextData['data'].reviewed_by?.last_name}`,
        );
        // assign email salutation
        contextData['salutation'] = salutation?.replace(
          '{recipient}',
          `${contextData['data'].approved_by?.first_name} ${contextData['data'].approved_by?.last_name}`,
        );
        // assign email title
        title = title?.replace('{action}', 'Reviewed');
        contextData['title'] = title?.replace(
          '{control_no}',
          data['control_no'],
        );
        // assign email recipient
        mailerData['to'] = approver;
        break;

      case TransactionalStatusEnum.APPROVED:
        contextData['status'] = TransactionalStatusEnum.APPROVED;
        // assign email body message
        contextData['bodyMessage'] = body4?.replace(
          '{user}',
          `${contextData['data'].approved_by?.first_name} ${contextData['data'].approved_by?.last_name}`,
        );
        // assign email salutation
        contextData['salutation'] = salutation?.replace(
          '{recipient}',
          `${contextData['data'].created_by?.first_name} ${contextData['data'].created_by?.last_name}`,
        );
        // assign email title
        title = title?.replace('{action}', 'Approved');
        contextData['title'] = title?.replace(
          '{control_no}',
          data['control_no'],
        );
        // assign email recipients
        mailerData['to'] = creator;
        mailerData['cc'] = [endorser, reviewer, approver];
        break;
    }
    // mailer template
    mailerData['templatePath'] = path.join(
      this.configService.getOrThrow('app.workingDirectory', {
        infer: true,
      }),
      'src',
      'mail',
      'mail-templates',
      'purchase-order.hbs',
    );

    // attachments
    if (mailData.data?.content.attachments) {
      contextData['attachments'] = mailData.data?.content.attachments;
      mailerData['attachments'] = {
        filename: mailData.data?.content.attachments.file_name,
        path: mailData.data?.content.attachments.file_path,
      };
    }

    // mailer content
    mailerData['subject'] = contextData['title'];
    mailerData['text'] = contextData['title'];
    mailerData['context'] = {
      domain: this.configService.getOrThrow('app.frontendDomain', {
        infer: true,
      }),
      title: contextData['title'],
      // ctaApprove: `this is a testing approve URL`,
      // ctaDisapprove: `this is a testing disapprove URL`,
      app_name: this.configService.get('app.name', { infer: true }),
      logo_url: this.getLogoUrl(),
      body5,
      ...contextData,
    };

    return mailerData;
  }

  /**
   * Send notification email.
   *
   * @param mailData - Notification email data
   */
  async sendNotificationEmail(
    mailData: MailData<{
      userName: string;
      title: string;
      body: string;
      type: string;
      entityType?: string;
      entityId?: number;
      actionUrl?: string;
      amount?: number;
      // Order-specific fields
      orderNumber?: string;
      orderItems?: Array<{
        product_name?: string;
        variant_name?: string;
        image_url?: string;
        quantity?: number;
        unit_price?: number;
        total_price?: number;
      }>;
      subtotal?: number;
      shippingAmount?: number;
      taxAmount?: number;
      discountAmount?: number;
      shippingAddress?: string;
      trackingNumber?: string;
      shippingProvider?: string;
      estimatedDelivery?: string;
      sellerName?: string;
      customerName?: string;
      // Return-specific fields
      returnNumber?: string;
      returnItems?: Array<{
        product_name?: string;
        variant_name?: string;
        image_url?: string;
        quantity_returning?: number;
        quantity_ordered?: number;
        unit_price?: number;
        return_amount?: number;
      }>;
      refundAmount?: number;
      refund_amount?: number; // Add snake_case for template compatibility
      returnReason?: string;
      pickupAddress?: string;
      pickupDate?: string;
      // Membership-specific fields
      expiryDate?: string;
      graceEndsAt?: string;
    }>,
  ): Promise<void> {
    const i18n = I18nContext.current();
    let greeting: MaybeType<string>;
    let footer: MaybeType<string>;

    if (i18n) {
      [greeting, footer] = await Promise.all([
        i18n.t('notification.greeting'),
        i18n.t('notification.footer'),
      ]);
    }

    // Get template name based on notification type
    const templateName = this.getNotificationTemplateName(mailData.data.type);

    await this.mailerService.sendMail({
      to: mailData.to,
      subject: mailData.data.title,
      text: `${mailData.data.title}: ${mailData.data.body}`,
      templatePath: path.join(
        this.configService.getOrThrow('app.workingDirectory', {
          infer: true,
        }),
        'src',
        'mail',
        'mail-templates',
        `${templateName}.hbs`,
      ),
      context: {
        title: mailData.data.title,
        userName: mailData.data.userName,
        body: mailData.data.body,
        type: mailData.data.type,
        entityType: mailData.data.entityType,
        entityId: mailData.data.entityId,
        memberNumber:
          mailData.data.entityType === 'membership' && mailData.data.entityId
            ? `MBR-${String(mailData.data.entityId).padStart(5, '0')}`
            : undefined,
        actionUrl: mailData.data.actionUrl,
        amount: mailData.data.amount
          ? `₱${Number(mailData.data.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
          : undefined,
        app_name: this.configService.get('app.name', { infer: true }),
        greeting: greeting || 'Hello',
        footer,
        domain: this.configService.getOrThrow('app.frontendDomain', {
          infer: true,
        }),
        logo_url: this.getLogoUrl(),
        expiryDate: mailData.data.expiryDate,
        graceEndsAt: mailData.data.graceEndsAt,
        // Order-specific context
        order_number: mailData.data.orderNumber,
        order_items: mailData.data.orderItems?.map((item) => ({
          ...item,
          unit_price: item.unit_price
            ? `₱${Number(item.unit_price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
            : undefined,
          total_price: item.total_price
            ? `₱${Number(item.total_price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
            : undefined,
        })),
        subtotal: mailData.data.subtotal
          ? `₱${Number(mailData.data.subtotal).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
          : undefined,
        shipping_amount: mailData.data.shippingAmount
          ? `₱${Number(mailData.data.shippingAmount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
          : undefined,
        tax_amount: mailData.data.taxAmount
          ? `₱${Number(mailData.data.taxAmount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
          : undefined,
        discount_amount: mailData.data.discountAmount
          ? `₱${Number(mailData.data.discountAmount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
          : undefined,
        shipping_address: mailData.data.shippingAddress,
        tracking_number: mailData.data.trackingNumber,
        shipping_provider: mailData.data.shippingProvider,
        estimated_delivery: mailData.data.estimatedDelivery,
        seller_name: mailData.data.sellerName,
        customer_name: mailData.data.customerName,
        // Return-specific context
        return_number: mailData.data.returnNumber,
        return_items: mailData.data.returnItems?.map((item) => ({
          ...item,
          unit_price: item.unit_price
            ? `₱${Number(item.unit_price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
            : undefined,
          return_amount: item.return_amount
            ? `₱${Number(item.return_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
            : undefined,
        })),
        refund_amount: mailData.data.refundAmount
          ? `₱${Number(mailData.data.refundAmount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
          : undefined,
        return_reason: mailData.data.returnReason,
        pickup_address: mailData.data.pickupAddress,
        pickup_date: mailData.data.pickupDate,
      },
    });
  }

  /**
   * Get notification template name based on type.
   *
   * @param type - Notification type
   * @returns Template filename
   */
  private getNotificationTemplateName(
    type: NotificationTypeEnum | string,
  ): string {
    switch (type) {
      // Booking events
      case NotificationTypeEnum.BOOKING_CONFIRMED:
      case 'booking_confirmed':
        return 'booking-confirmed';
      case NotificationTypeEnum.MILESTONE_SUBMITTED:
      case 'milestone_submitted':
        return 'milestone-submitted';
      case NotificationTypeEnum.PAYMENT_RECEIVED:
      case 'payment_received':
        return 'payment-received';

      // Order events
      case NotificationTypeEnum.ORDER_PLACED:
      case 'order_placed':
        return 'order-placed';
      case NotificationTypeEnum.ORDER_CONFIRMED:
      case 'order_confirmed':
        return 'order-confirmed';
      case NotificationTypeEnum.ORDER_PROCESSING:
      case 'order_processing':
        return 'order-processing';
      case NotificationTypeEnum.ORDER_READY_TO_SHIP:
      case 'order_ready_to_ship':
        return 'order-ready-to-ship';
      case NotificationTypeEnum.ORDER_SHIPPED:
      case 'order_shipped':
        return 'order-shipped';
      case NotificationTypeEnum.ORDER_OUT_FOR_DELIVERY:
      case 'order_out_for_delivery':
        return 'order-out-for-delivery';
      case NotificationTypeEnum.ORDER_DELIVERED:
      case 'order_delivered':
        return 'order-delivered';
      case NotificationTypeEnum.ORDER_CANCELLED:
      case 'order_cancelled':
        return 'order-cancelled';

      // Payment events
      case NotificationTypeEnum.PAYMENT_SUCCESSFUL:
      case 'payment_successful':
        return 'payment-success';
      case NotificationTypeEnum.PAYMENT_FAILED:
      case 'payment_failed':
        return 'payment-failed';
      case NotificationTypeEnum.PAYMENT_SUBMITTED:
      case 'payment_submitted':
        return 'payment-received';
      case NotificationTypeEnum.MEMBERSHIP_EXPIRING_SOON:
      case 'membership_expiring_soon':
        return 'membership-expiring-soon';
      case NotificationTypeEnum.MEMBERSHIP_GRACE_PERIOD:
      case 'membership_grace_period':
        return 'membership-grace-period';
      case NotificationTypeEnum.MEMBERSHIP_PAYMENT_CONFIRMED:
      case 'membership_payment_confirmed':
        return 'membership-payment-success';
      case NotificationTypeEnum.MEMBERSHIP_PAYMENT_VOIDED:
      case 'membership_payment_voided':
        return 'membership-payment-voided';
      case NotificationTypeEnum.MEMBERSHIP_PAYMENT_SUBMITTED:
      case 'membership_payment_submitted':
        return 'membership-payment-submitted';
      case NotificationTypeEnum.MEMBERSHIP_PAYMENT_SUBMITTED_ADMIN:
      case 'membership_payment_submitted_admin':
        return 'membership-payment-submitted-admin';

      // Return/Refund events
      case NotificationTypeEnum.RETURN_REQUESTED:
      case 'return_requested':
        return 'return-requested';
      case NotificationTypeEnum.RETURN_APPROVED:
      case 'return_approved':
        return 'return-approved';
      case NotificationTypeEnum.RETURN_REJECTED:
      case 'return_rejected':
        return 'return-rejected';
      case NotificationTypeEnum.RETURN_PICKUP_SCHEDULED:
      case 'return_pickup_scheduled':
        return 'return-pickup-scheduled';
      case NotificationTypeEnum.RETURN_PICKED_UP:
      case 'return_picked_up':
        return 'return-picked-up';
      case NotificationTypeEnum.RETURN_RECEIVED:
      case 'return_received':
        return 'return-received';
      case NotificationTypeEnum.REFUND_PROCESSED:
      case 'refund_processed':
        return 'refund-processed';

      default:
        return 'general-notification';
    }
  }

  async sendAccountDeletionOTP(email: string, otp: string): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Verify Your Account Deletion Request - Adtokart',
      templatePath: path.join(
        this.configService.getOrThrow('app.workingDirectory', {
          infer: true,
        }),
        'src',
        'mail',
        'mail-templates',
        'account-deletion-otp.hbs',
      ),
      context: {
        email,
        otp,
        expiresInMinutes: 5,
        app_name: this.getAppName(),
        logo_url: this.getLogoUrl(),
      },
    });
  }

  async sendAccountDeletionConfirmation(
    email: string,
    referenceNumber: string,
    fullName: string,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Account Deletion Request Received - Adtokart',
      templatePath: path.join(
        this.configService.getOrThrow('app.workingDirectory', {
          infer: true,
        }),
        'src',
        'mail',
        'mail-templates',
        'account-deletion-confirmation.hbs',
      ),
      context: {
        email,
        referenceNumber,
        fullName,
        estimatedDays: 30,
        app_name: this.getAppName(),
        logo_url: this.getLogoUrl(),
      },
    });
  }

  async sendAccountDeletionAdminNotification(requestDetails: {
    email: string;
    full_name: string;
    reason: string;
    reference_number: string;
    created_at: Date;
  }): Promise<void> {
    const adminEmail = this.configService.get('app.adminEmail', {
      infer: true,
    });

    await this.mailerService.sendMail({
      to: adminEmail,
      subject: `New Account Deletion Request - ${requestDetails.reference_number}`,
      templatePath: path.join(
        this.configService.getOrThrow('app.workingDirectory', {
          infer: true,
        }),
        'src',
        'mail',
        'mail-templates',
        'account-deletion-admin-notification.hbs',
      ),
      context: {
        ...requestDetails,
        app_name: this.getAppName(),
        logo_url: this.getLogoUrl(),
      },
    });
  }
}
