/**
 * Cancellation Policy Enum.
 *
 * Defines the policy applied to the cancellation.
 *
 * @version 1
 * @since 1.0.0
 */
export enum CancellationPolicyEnum {
  FREE_CANCELLATION = 'free_cancellation', // No fee, full refund (e.g., >48 hours before)
  PARTIAL_CHARGE = 'partial_charge', // Partial fee, partial refund (e.g., 24-48 hours before)
  FULL_CHARGE = 'full_charge', // Full fee, no refund (e.g., <24 hours or no-show)
  PROVIDER_FAULT = 'provider_fault', // Provider cancelled, full refund + possible compensation
  ADMIN_OVERRIDE = 'admin_override', // Admin manually overrode policy
}
