/**
 * Booking Add-on Domain Class.
 *
 * Represents a snapshot of a service add-on attached to a booking.
 * Contains denormalized data from the original add-on for historical accuracy.
 */
export class BookingAddon {
  id: number;
  booking_id: number;
  addon_id: number | null;
  addon_name: string;
  addon_code: string;
  addon_description: string | null;
  unit_type: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  duration_minutes: number | null;
  created_by: number | null;
  created_at: Date;
  updated_by: number | null;
  updated_at: Date;
}
