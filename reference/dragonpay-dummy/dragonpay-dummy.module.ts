import { Module } from '@nestjs/common';
import { DragonPayDummyController } from './dragonpay-dummy.controller';
import { DragonPayDummyService } from './dragonpay-dummy.service';

/**
 * DragonPay Dummy Module
 *
 * Provides dummy endpoints that simulate DragonPay Payment Gateway API.
 * Use for development/testing while waiting for production credentials.
 *
 * Features:
 * - Create payment requests (returns dummy payment URL)
 * - Transaction status inquiry
 * - Transaction cancellation
 * - Available processors list
 * - Simulated payment page (for testing redirects)
 * - Postback/webhook simulation
 * - Payout creation (mock)
 * - Payout status inquiry (mock)
 * - Payout simulation (test helper)
 *
 * Transactions and payouts are stored in-memory and reset on server restart.
 *
 * @example
 * // Create a payment
 * POST /api/v1/dragonpay-dummy/collect
 * {
 *   "txnid": "TXN-123",
 *   "amount": 1000,
 *   "ccy": "PHP",
 *   "description": "Payment for booking",
 *   "email": "customer@example.com"
 * }
 *
 * // Simulate successful payment
 * POST /api/v1/dragonpay-dummy/simulate
 * {
 *   "txnid": "TXN-123",
 *   "status": "S"
 * }
 */
@Module({
  controllers: [DragonPayDummyController],
  providers: [DragonPayDummyService],
  exports: [DragonPayDummyService],
})
export class DragonPayDummyModule {}
