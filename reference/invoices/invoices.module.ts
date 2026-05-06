import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { InvoicePersistenceModule } from './persistence/persistence.module';
import { SalesOrderEntity } from '@/sales-orders/persistence/entities/sales-order.entity';
import { MailerModule } from '@/mailer/mailer.module';

/**
 * Invoices Module
 * Provides invoice generation and management functionality
 */
@Module({
  imports: [
    InvoicePersistenceModule,
    TypeOrmModule.forFeature([SalesOrderEntity]),
    MailerModule,
    JwtModule.register({}),
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
