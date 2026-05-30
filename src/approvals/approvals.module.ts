import { Module } from '@nestjs/common';
import { ApprovalsController } from './controllers/approvals.controller';
import { ApprovalsService } from './approvals.service';

/**
 * Approvals inbox module — v0 ships the gate + the contract; data lands
 * with the leave module.
 *
 * No persistence layer in v0 (no table to map). When `approval_chains`
 * and `leave_requests` land, add `persistence/` here and inject a
 * `BasePendingApprovalRepository` into the service.
 */
@Module({
  controllers: [ApprovalsController],
  providers: [ApprovalsService],
})
export class ApprovalsModule {}
