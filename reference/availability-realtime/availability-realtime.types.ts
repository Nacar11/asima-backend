export type AvailabilityChangeType =
  | 'slot_blocked'
  | 'open_play_blocked'
  | 'blocked_released'
  | 'booking_created'
  | 'open_play_registered'
  | 'open_play_cancelled'
  | 'open_play_updated'
  | 'booking_cancelled';

export type AvailabilityChangedPayload = {
  event_id: string;
  occurred_at: string;
  change_type: AvailabilityChangeType;
  seller_id: number;
  service_id: number | null;
  date: string;
  start_time: string | null;
  end_time: string | null;
  block_type: 'maintenance' | 'open_play' | null;
  open_play_event_id: number | null;
  source: string;
};

export type PublishAvailabilityChangedPayload = Omit<
  AvailabilityChangedPayload,
  'event_id' | 'occurred_at'
> & {
  event_id?: string;
  occurred_at?: string | Date;
};

export type AvailabilitySubscribePayload = {
  start_date: string;
  end_date: string;
  service_ids?: number[];
};
