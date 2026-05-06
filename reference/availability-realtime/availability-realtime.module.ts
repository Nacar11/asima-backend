import { Module } from '@nestjs/common';
import { AvailabilityRealtimeGateway } from './availability-realtime.gateway';
import { AvailabilityRealtimeService } from './availability-realtime.service';

@Module({
  providers: [AvailabilityRealtimeGateway, AvailabilityRealtimeService],
  exports: [AvailabilityRealtimeService],
})
export class AvailabilityRealtimeModule {}
