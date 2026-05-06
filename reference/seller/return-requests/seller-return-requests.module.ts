import { Module } from '@nestjs/common';
import { SellerReturnRequestsController } from './seller-return-requests.controller';
import { ReturnRequestsModule } from '@/return-requests/return-requests.module';
import { SellerSalesOrdersModule } from '@/seller/sales-orders/seller-sales-orders.module';

@Module({
  imports: [ReturnRequestsModule, SellerSalesOrdersModule],
  controllers: [SellerReturnRequestsController],
})
export class SellerReturnRequestsModule {}
