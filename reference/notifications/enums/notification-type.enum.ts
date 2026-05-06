/**
 * Notification type enumeration.
 *
 * Represents the type of notification for Travajo (services/bookings) and e-commerce.
 * Notifications are categorized by recipient: Buyer (customer) or Seller (provider).
 *
 * @version 3
 * @since 1.0.0
 */
export enum NotificationTypeEnum {
  // =============================================
  // BOOKING EVENTS - BUYER (Customer) Notifications
  // =============================================

  /** Booking request has been submitted (buyer confirmation) */
  BOOKING_SUBMITTED = 'booking_submitted',

  /** Booking has been confirmed by the seller */
  BOOKING_CONFIRMED = 'booking_confirmed',

  /** Booking has been rejected by the seller */
  BOOKING_REJECTED = 'booking_rejected',

  /** Booking has been cancelled */
  BOOKING_CANCELLED = 'booking_cancelled',

  /** Reminder about upcoming booking */
  BOOKING_REMINDER = 'booking_reminder',

  /** Booking is starting soon */
  BOOKING_STARTING_SOON = 'booking_starting_soon',

  /** Booking has started */
  BOOKING_STARTED = 'booking_started',

  /** Booking has been completed */
  BOOKING_COMPLETED = 'booking_completed',

  /** Provider has been assigned to the booking */
  BOOKING_ASSIGNED = 'booking_assigned',

  /** Booking has been rescheduled */
  BOOKING_RESCHEDULED = 'booking_rescheduled',

  /** Booking details have been updated */
  BOOKING_UPDATED = 'booking_updated',

  /** Venue booking has been submitted */
  VENUE_BOOKING_SUBMITTED = 'venue_booking_submitted',

  // =============================================
  // BOOKING EVENTS - SELLER (Provider) Notifications
  // =============================================

  /** New booking request received */
  NEW_BOOKING_REQUEST = 'new_booking_request',

  /** Buyer has cancelled the booking */
  BOOKING_CANCELLED_BY_BUYER = 'booking_cancelled_by_buyer',

  /** Reminder to confirm pending booking */
  BOOKING_PENDING_CONFIRMATION = 'booking_pending_confirmation',

  // =============================================
  // MILESTONE EVENTS - BUYER Notifications
  // =============================================

  /** Milestone work has started */
  MILESTONE_STARTED = 'milestone_started',

  /** Milestone has been submitted for review */
  MILESTONE_SUBMITTED = 'milestone_submitted',

  /** Milestone revision has been submitted */
  MILESTONE_REVISION_SUBMITTED = 'milestone_revision_submitted',

  /** All milestones completed - service finished */
  ALL_MILESTONES_COMPLETED = 'all_milestones_completed',

  // =============================================
  // MILESTONE EVENTS - SELLER Notifications
  // =============================================

  /** Milestone has been approved by buyer */
  MILESTONE_APPROVED = 'milestone_approved',

  /** Milestone has been rejected by buyer */
  MILESTONE_REJECTED = 'milestone_rejected',

  /** Milestone revision requested by buyer */
  MILESTONE_REVISION_REQUESTED = 'milestone_revision_requested',

  /** Reminder: Milestone deadline approaching */
  MILESTONE_DEADLINE_APPROACHING = 'milestone_deadline_approaching',

  /** Milestone is overdue */
  MILESTONE_OVERDUE = 'milestone_overdue',

  // =============================================
  // QUOTE EVENTS - BUYER Notifications
  // =============================================

  /** Quote has been received from seller */
  QUOTE_RECEIVED = 'quote_received',

  /** Quote is about to expire */
  QUOTE_EXPIRING_SOON = 'quote_expiring_soon',

  /** Quote has expired */
  QUOTE_EXPIRED = 'quote_expired',

  // =============================================
  // QUOTE EVENTS - SELLER Notifications
  // =============================================

  /** New quote request received */
  QUOTE_REQUESTED = 'quote_requested',

  /** Quote has been accepted by buyer */
  QUOTE_ACCEPTED = 'quote_accepted',

  /** Quote has been rejected by buyer */
  QUOTE_REJECTED = 'quote_rejected',

  /** Customer requests quotation revision */
  QUOTATION_REVISION_REQUESTED = 'quotation_revision_requested',

  // =============================================
  // DPO ASSESSMENT EVENTS
  // =============================================

  /** Assessment booking has started (for provider) */
  ASSESSMENT_STARTED = 'assessment_started',

  /** Assessment booking completed (for customer) */
  ASSESSMENT_COMPLETED = 'assessment_completed',

  /** Quotation revision sent (for customer) */
  QUOTATION_REVISION_SENT = 'quotation_revision_sent',

  /** Service bookings created from accepted quotation (for provider) */
  SERVICE_BOOKINGS_CREATED = 'service_bookings_created',

  // =============================================
  // PAYMENT EVENTS - BUYER Notifications
  // =============================================

  /** Payment has been processed successfully */
  PAYMENT_SUCCESSFUL = 'payment_successful',

  /** Payment has failed */
  PAYMENT_FAILED = 'payment_failed',

  /** Manual QR payment submitted by user, awaiting admin confirmation */
  PAYMENT_SUBMITTED = 'payment_submitted',

  /** Booking payment proof is awaiting confirmation */
  BOOKING_PAYMENT_AWAITING_CONFIRMATION = 'booking_payment_awaiting_confirmation',

  /** Booking payment was confirmed */
  BOOKING_PAYMENT_CONFIRMED = 'booking_payment_confirmed',

  /** Booking payment was rejected */
  BOOKING_PAYMENT_REJECTED = 'booking_payment_rejected',

  /** Booking payment expired */
  BOOKING_PAYMENT_EXPIRED = 'booking_payment_expired',

  /** Membership payment confirmed by admin */
  MEMBERSHIP_PAYMENT_CONFIRMED = 'membership_payment_confirmed',

  /** Membership payment voided/rejected by admin */
  MEMBERSHIP_PAYMENT_VOIDED = 'membership_payment_voided',

  /** Membership payment submitted, awaiting admin confirmation */
  MEMBERSHIP_PAYMENT_SUBMITTED = 'membership_payment_submitted',

  /** Membership payment submitted by user — admin notification */
  MEMBERSHIP_PAYMENT_SUBMITTED_ADMIN = 'membership_payment_submitted_admin',

  /** Membership is expiring in 7 days — sent when entering grace period */
  MEMBERSHIP_EXPIRING_SOON = 'membership_expiring_soon',

  /** Membership has expired and member is now in grace period */
  MEMBERSHIP_GRACE_PERIOD = 'membership_grace_period',

  /** Refund has been processed */
  REFUND_PROCESSED = 'refund_processed',

  /** Escrow funds released to seller */
  ESCROW_RELEASED = 'escrow_released',

  // =============================================
  // PAYMENT EVENTS - SELLER Notifications
  // =============================================

  /** Payment received from buyer (funds in escrow) */
  PAYMENT_RECEIVED = 'payment_received',

  /** Milestone payment released from escrow */
  MILESTONE_PAYMENT_RELEASED = 'milestone_payment_released',

  /** Payout to bank account completed */
  PAYOUT_COMPLETED = 'payout_completed',

  /** Payout failed */
  PAYOUT_FAILED = 'payout_failed',

  // =============================================
  // REVIEW EVENTS
  // =============================================

  /** Review received (for seller) */
  REVIEW_RECEIVED = 'review_received',

  /** Reminder to leave a review (for buyer) */
  REVIEW_REMINDER = 'review_reminder',

  /** Seller responded to your review (for buyer) */
  REVIEW_RESPONSE_RECEIVED = 'review_response_received',

  // =============================================
  // MESSAGE EVENTS
  // =============================================

  /** New message received */
  MESSAGE_RECEIVED = 'message_received',

  // =============================================
  // MERCHANT ONBOARDING EVENTS
  // =============================================

  /** Independent pickleball merchant application submitted */
  MERCHANT_APPLICATION_SUBMITTED = 'merchant_application_submitted',

  // =============================================
  // ORDER EVENTS (Marketplace/E-commerce)
  // =============================================

  /** Order has been placed */
  ORDER_PLACED = 'order_placed',

  /** Order has been confirmed */
  ORDER_CONFIRMED = 'order_confirmed',

  /** Order is being processed */
  ORDER_PROCESSING = 'order_processing',

  /** Order is ready to ship */
  ORDER_READY_TO_SHIP = 'order_ready_to_ship',

  /** Order has been shipped */
  ORDER_SHIPPED = 'order_shipped',

  /** Order is out for delivery */
  ORDER_OUT_FOR_DELIVERY = 'order_out_for_delivery',

  /** Order has been delivered */
  ORDER_DELIVERED = 'order_delivered',

  /** Order has been completed */
  ORDER_COMPLETED = 'order_completed',

  /** Order has been cancelled */
  ORDER_CANCELLED = 'order_cancelled',

  // =============================================
  // PICKUP EVENTS
  // =============================================

  /** Pickup order has been confirmed */
  ORDER_PICKUP_CONFIRMED = 'order_pickup_confirmed',

  /** Pickup order is being processed */
  ORDER_PICKUP_PROCESSING = 'order_pickup_processing',

  /** Pickup order is ready for pickup */
  ORDER_PICKUP_READY = 'order_pickup_ready',

  /** Pickup reminder notification */
  ORDER_PICKUP_REMINDER = 'order_pickup_reminder',

  /** Pickup no-show warning */
  ORDER_PICKUP_NOSHOW_WARNING = 'order_pickup_noshow_warning',

  /** Pickup order has been completed */
  ORDER_PICKUP_COMPLETED = 'order_pickup_completed',

  /** Pickup order has been cancelled */
  ORDER_PICKUP_CANCELLED = 'order_pickup_cancelled',

  // =============================================
  // RETURN/REFUND EVENTS
  // =============================================

  /** Return has been requested */
  RETURN_REQUESTED = 'return_requested',

  /** Return has been approved */
  RETURN_APPROVED = 'return_approved',

  /** Return has been rejected */
  RETURN_REJECTED = 'return_rejected',

  /** Return pickup has been scheduled */
  RETURN_PICKUP_SCHEDULED = 'return_pickup_scheduled',

  /** Return has been picked up */
  RETURN_PICKED_UP = 'return_picked_up',

  /** Return has been received */
  RETURN_RECEIVED = 'return_received',

  // =============================================
  // DISPUTE EVENTS - BUYER (Customer) Notifications
  // =============================================

  /** Dispute resolved with refund */
  DISPUTE_RESOLVED_REFUND = 'dispute_resolved_refund',

  /** Dispute resolved without refund */
  DISPUTE_RESOLVED_NO_REFUND = 'dispute_resolved_no_refund',

  /** Provider responded to customer's dispute */
  DISPUTE_PROVIDER_RESPONDED = 'dispute_provider_responded',

  // =============================================
  // DISPUTE EVENTS - SELLER (Provider) Notifications
  // =============================================

  /** Customer filed a dispute */
  DISPUTE_FILED = 'dispute_filed',

  /** Customer filed a dispute (admin notification) */
  DISPUTE_FILED_ADMIN = 'dispute_filed_admin',

  /** Customer added evidence to dispute */
  DISPUTE_EVIDENCE_ADDED = 'dispute_evidence_added',

  /** Customer replied to provider's dispute response */
  DISPUTE_CUSTOMER_REPLIED = 'dispute_customer_replied',

  /** Dispute resolved (seller notification) */
  DISPUTE_RESOLVED = 'dispute_resolved',

  /** Dispute escalated */
  DISPUTE_ESCALATED = 'dispute_escalated',

  // =============================================
  // SYSTEM EVENTS
  // =============================================

  /** System announcement */
  SYSTEM_ANNOUNCEMENT = 'system_announcement',

  // =============================================
  // WALLET EVENTS - SELLER Notifications
  // =============================================

  /** Seller earnings credited to wallet after order completion */
  SELLER_EARNINGS_CREDITED = 'seller_earnings_credited',

  /** Seller requested a withdrawal (confirmation) */
  SELLER_WITHDRAWAL_REQUESTED = 'seller_withdrawal_requested',

  /** Admin marked withdrawal as processing */
  SELLER_WITHDRAWAL_PROCESSING = 'seller_withdrawal_processing',

  /** Withdrawal completed and funds transferred to bank */
  SELLER_WITHDRAWAL_COMPLETED = 'seller_withdrawal_completed',

  /** Withdrawal failed at bank */
  SELLER_WITHDRAWAL_FAILED = 'seller_withdrawal_failed',

  /** Return deduction applied to seller wallet */
  SELLER_WALLET_RETURN_DEDUCTION = 'seller_wallet_return_deduction',

  /** Return deduction exceeded wallet balance — debt flagged for admin resolution */
  SELLER_WALLET_DEBT_FLAGGED = 'seller_wallet_debt_flagged',
}
