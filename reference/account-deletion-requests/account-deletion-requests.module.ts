import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountDeletionRequestsController } from './account-deletion-requests.controller';
import { AccountDeletionCsrfController } from './account-deletion-requests.controller-csrf';
import { AccountDeletionRequestsService } from './account-deletion-requests.service';
import { CsrfService } from './services/csrf.service';
import { CsrfGuard } from './guards/csrf.guard';
import { AccountDeletionRequestEntity } from './persistence/relational/entities/account-deletion-request.entity';
import { DeletionOtpEntity } from './persistence/relational/entities/deletion-otp.entity';
import { MailModule } from '@/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccountDeletionRequestEntity, DeletionOtpEntity]),
    MailModule,
  ],
  controllers: [
    AccountDeletionRequestsController,
    AccountDeletionCsrfController,
  ],
  providers: [AccountDeletionRequestsService, CsrfService, CsrfGuard],
  exports: [AccountDeletionRequestsService, CsrfService],
})
export class AccountDeletionRequestsModule {}
