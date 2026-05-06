/**
 * Booking Option Domain Class.
 *
 * Represents a snapshot of a service option selection attached to a booking.
 * Contains denormalized data from the original option group and value for historical accuracy.
 */
export class BookingOption {
  id: number;
  booking_id: number;
  option_group_id: number | null;
  option_value_id: number | null;
  group_name: string;
  group_code: string;
  value_label: string;
  value_code: string;
  quantity: number;
  price_adjustment: number;
  duration_adjustment_minutes: number;
  created_by: number | null;
  created_at: Date;
  updated_by: number | null;
  updated_at: Date;
}
