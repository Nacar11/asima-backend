import { Module } from '@nestjs/common';
import { SalesReportController } from '@/seller/sales-report/sales-report.controller';
import { SalesReportService } from '@/seller/sales-report/sales-report.service';
import { SalesReportPersistenceModule } from '@/seller/sales-report/persistence/persistence.module';

@Module({
  imports: [SalesReportPersistenceModule],
  controllers: [SalesReportController],
  providers: [SalesReportService],
  exports: [SalesReportService],
})
export class SalesReportModule {}
