import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckoutSession } from './entities/checkout-session.entity';
import { CheckoutSessionsService } from './checkout-sessions.service';

@Module({
  imports: [TypeOrmModule.forFeature([CheckoutSession])],
  providers: [CheckoutSessionsService],
  exports: [CheckoutSessionsService, TypeOrmModule],
})
export class CheckoutSessionsModule {}
