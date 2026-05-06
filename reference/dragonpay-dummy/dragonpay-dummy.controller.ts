import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { DragonPayDummyService } from './dragonpay-dummy.service';
import {
  CreatePaymentRequestDto,
  PaymentResponseDto,
  TransactionStatusResponseDto,
  GetProcessorsDto,
  GetProcessorsResponseDto,
  SimulatePaymentDto,
  SimulatePaymentResponseDto,
  PostbackCallbackDto,
  StoredTransactionDto,
  CreatePayoutRequestDto,
  PayoutResponseDto,
  PayoutStatusResponseDto,
  SimulatePayoutDto,
  SimulatePayoutResponseDto,
} from './dto';
import { DragonPayStatusEnum } from './enums/dragonpay-status.enum';

/**
 * DragonPay Dummy Controller
 *
 * Provides dummy endpoints that simulate DragonPay Payment Gateway API.
 * Use these endpoints for development/testing while waiting for
 * production DragonPay credentials.
 *
 * Note: This controller is NOT protected by authentication to allow
 * webhook callbacks and payment page access.
 */
@ApiTags('DragonPay Dummy')
@Controller({
  path: 'dragonpay-dummy',
  version: '1',
})
export class DragonPayDummyController {
  constructor(private readonly service: DragonPayDummyService) {}

  // ============================================================================
  // Payment API Endpoints (Section 5.2)
  // ============================================================================

  @Post('collect')
  @ApiOperation({
    summary: 'Create payment request',
    description:
      'Creates a new payment request and returns a payment URL. Simulates DragonPay API Section 5.2.',
  })
  @ApiCreatedResponse({
    type: PaymentResponseDto,
    description: 'Payment request created successfully',
  })
  createPayment(@Body() dto: CreatePaymentRequestDto): PaymentResponseDto {
    console.log(
      'Dummy controller POST /collect called with:',
      JSON.stringify(dto, null, 2),
    );
    try {
      return this.service.createPayment(dto);
    } catch (e) {
      console.error('Dummy controller error:', e);
      throw e;
    }
  }

  // ============================================================================
  // Transaction Status Endpoints (Section 5.3)
  // ============================================================================

  @Get('collect/:txnid')
  @ApiOperation({
    summary: 'Get transaction status',
    description:
      'Returns the current status of a transaction. Simulates DragonPay API Section 5.3.1.',
  })
  @ApiParam({
    name: 'txnid',
    type: String,
    description: 'Merchant transaction ID',
  })
  @ApiOkResponse({
    type: TransactionStatusResponseDto,
    description: 'Transaction status retrieved successfully',
  })
  getTransactionStatus(
    @Param('txnid') txnid: string,
  ): TransactionStatusResponseDto {
    return this.service.getTransactionStatus(txnid);
  }

  @Delete('collect/:txnid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel transaction',
    description:
      'Cancels a pending transaction. Simulates DragonPay API Section 5.3.2.',
  })
  @ApiParam({
    name: 'txnid',
    type: String,
    description: 'Merchant transaction ID',
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        refNo: { type: 'string' },
        message: { type: 'string' },
      },
    },
    description: 'Transaction cancelled successfully',
  })
  cancelTransaction(@Param('txnid') txnid: string): {
    refNo: string;
    message: string;
  } {
    return this.service.cancelTransaction(txnid);
  }

  // ============================================================================
  // Public Keys Endpoint (spec section 5.3.3) — used for RSA-SHA256 verification
  // URL matches what DragonPayV2Service requests: replaces /v2 -> /v1/keys/callback
  // ============================================================================

  @Get('collect/v1/keys/callback')
  @ApiOperation({
    summary: 'Get RSA public keys for callback verification',
    description:
      'Returns the dummy RSA public key generated at startup. Simulates GET /keys/callback from DragonPay spec section 5.3.3.',
  })
  @ApiOkResponse({
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          value: {
            type: 'string',
            description: 'Base64-encoded DER public key',
          },
          status: { type: 'string', enum: ['Active', 'Revoked'] },
        },
      },
    },
  })
  getPublicKeys(): { value: string; status: 'Active' | 'Revoked' }[] {
    return this.service.getPublicKeys();
  }

  // ============================================================================
  // Processors Endpoint (Section 7.2.2)
  // ============================================================================

  @Get('processors')
  @ApiOperation({
    summary: 'Get available payment processors',
    description:
      'Returns list of available payment processors/channels. Simulates DragonPay API Section 7.2.2.',
  })
  @ApiOkResponse({
    type: GetProcessorsResponseDto,
    description: 'Available processors retrieved successfully',
  })
  getProcessors(@Query() dto: GetProcessorsDto): GetProcessorsResponseDto {
    return this.service.getAvailableProcessors(dto);
  }

  // ============================================================================
  // Postback/Webhook Endpoint
  // ============================================================================

  @Post('postback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receive postback callback',
    description:
      'Endpoint to receive postback/webhook callbacks. For testing webhook integration.',
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        received: { type: 'boolean' },
        valid: { type: 'boolean' },
        txnid: { type: 'string' },
        status: { type: 'string' },
      },
    },
  })
  receivePostback(@Body() dto: PostbackCallbackDto) {
    const isValid = this.service.verifyPostback(dto);
    return {
      received: true,
      valid: isValid,
      txnid: dto.txnid,
      status: dto.status,
    };
  }

  // ============================================================================
  // Simulation Endpoints (For Testing)
  // ============================================================================

  @Post('simulate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simulate payment completion',
    description:
      'Simulates a payment completion for testing. Updates transaction status and sends postback if configured.',
  })
  @ApiOkResponse({
    type: SimulatePaymentResponseDto,
    description: 'Payment simulation triggered',
  })
  simulatePayment(@Body() dto: SimulatePaymentDto): SimulatePaymentResponseDto {
    return this.service.simulatePayment(dto);
  }

  @Get('transactions')
  @ApiOperation({
    summary: 'List all dummy transactions',
    description: 'Returns all transactions stored in memory. For debugging.',
  })
  @ApiOkResponse({
    type: [StoredTransactionDto],
    description: 'List of all transactions',
  })
  getAllTransactions(): StoredTransactionDto[] {
    return this.service.getAllTransactions();
  }

  @Delete('transactions')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Clear all dummy transactions',
    description: 'Clears all transactions from memory. For testing cleanup.',
  })
  @ApiNoContentResponse({
    description: 'Transactions cleared',
  })
  clearTransactions() {
    this.service.clearTransactions();
  }

  // ============================================================================
  // Payout API Mock Endpoints
  // ============================================================================

  @Post('payout/:merchantId/post')
  @ApiOperation({
    summary: 'Create payout request (mock)',
    description:
      'Simulates DragonPay Payout API POST {payoutUrl}/{merchantId}/post. Returns { Code: 0, Message: refNo } on success.',
  })
  @ApiParam({
    name: 'merchantId',
    type: String,
    description: 'Merchant ID (ignored in mock)',
  })
  @ApiCreatedResponse({ type: PayoutResponseDto })
  createPayout(
    @Param('merchantId') _merchantId: string,
    @Body() dto: CreatePayoutRequestDto,
  ): PayoutResponseDto {
    return this.service.createPayout(dto);
  }

  @Get('payout/:merchantId/:txnId')
  @ApiOperation({
    summary: 'Get payout status (mock)',
    description:
      'Simulates DragonPay Payout API GET {payoutUrl}/{merchantId}/{txnId}. Returns PascalCase status response.',
  })
  @ApiParam({
    name: 'merchantId',
    type: String,
    description: 'Merchant ID (ignored in mock)',
  })
  @ApiParam({
    name: 'txnId',
    type: String,
    description: 'Payout transaction ID',
  })
  @ApiOkResponse({ type: PayoutStatusResponseDto })
  getPayoutStatus(
    @Param('merchantId') _merchantId: string,
    @Param('txnId') txnId: string,
  ): PayoutStatusResponseDto {
    return this.service.getPayoutStatus(txnId);
  }

  @Post('payout/simulate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simulate payout status change',
    description:
      'Test helper: changes a payout status to S (Success), F (Failed), or V (Voided) without a real bank.',
  })
  @ApiOkResponse({ type: SimulatePayoutResponseDto })
  simulatePayout(@Body() dto: SimulatePayoutDto): SimulatePayoutResponseDto {
    return this.service.simulatePayout(dto);
  }

  @Get('payouts')
  @ApiOperation({
    summary: 'List all dummy payouts',
    description:
      'Returns all payout transactions stored in memory. For debugging.',
  })
  @ApiOkResponse({ description: 'List of all payouts' })
  getAllPayouts() {
    return this.service.getAllPayouts();
  }

  // ============================================================================
  // Payment Page Simulation
  // ============================================================================

  @Get('pay')
  @UseInterceptors()
  @ApiOperation({
    summary: 'Dummy payment page',
    description:
      'Simulates the DragonPay payment page where customer completes payment.',
  })
  @ApiQuery({ name: 'txnid', type: String })
  @ApiQuery({ name: 'refno', type: String })
  getPaymentPage(
    @Query('txnid') txnid: string,
    @Query('refno') refno: string,
    @Res({ passthrough: false }) res: Response,
  ) {
    const transaction = this.service.getPaymentPageData(txnid);

    if (!transaction) {
      res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Transaction Not Found</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                   padding: 40px; background: #f5f5f5; }
            .error { background: white; padding: 40px; border-radius: 8px; max-width: 500px; 
                     margin: 0 auto; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #e74c3c; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>Transaction Not Found</h1>
            <p>Transaction ID: ${txnid}</p>
          </div>
        </body>
        </html>
      `);
      return;
    }

    // Render payment page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>DragonPay Dummy - Payment</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }
          .container { 
            background: white; padding: 40px; border-radius: 16px; max-width: 500px;
            margin: 0 auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          }
          .header { text-align: center; margin-bottom: 30px; }
          .header img { width: 150px; margin-bottom: 10px; }
          .header h1 { margin: 0; color: #333; font-size: 24px; }
          .header .badge { 
            display: inline-block; background: #ffeaa7; color: #d68910; 
            padding: 5px 15px; border-radius: 20px; font-size: 12px; margin-top: 10px;
          }
          .details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          .details-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .details-row:last-child { margin-bottom: 0; }
          .details-label { color: #666; }
          .details-value { font-weight: 600; color: #333; }
          .amount { font-size: 32px; text-align: center; color: #2ecc71; margin: 20px 0; }
          .buttons { display: flex; gap: 15px; }
          .btn { 
            flex: 1; padding: 15px; border: none; border-radius: 8px; font-size: 16px;
            cursor: pointer; font-weight: 600; transition: transform 0.2s, box-shadow 0.2s;
          }
          .btn:hover { transform: translateY(-2px); }
          .btn-success { background: #2ecc71; color: white; }
          .btn-success:hover { box-shadow: 0 5px 20px rgba(46,204,113,0.4); }
          .btn-cancel { background: #e74c3c; color: white; }
          .btn-cancel:hover { box-shadow: 0 5px 20px rgba(231,76,60,0.4); }
          .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🐉 DragonPay Dummy</h1>
            <div class="badge">TEST MODE</div>
          </div>
          
          <div class="amount">₱${transaction.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
          
          <div class="details">
            <div class="details-row">
              <span class="details-label">Reference:</span>
              <span class="details-value">${refno}</span>
            </div>
            <div class="details-row">
              <span class="details-label">Transaction ID:</span>
              <span class="details-value">${txnid}</span>
            </div>
            <div class="details-row">
              <span class="details-label">Description:</span>
              <span class="details-value">${transaction.description}</span>
            </div>
            <div class="details-row">
              <span class="details-label">Email:</span>
              <span class="details-value">${transaction.email}</span>
            </div>
            ${
              transaction.procId
                ? `
            <div class="details-row">
              <span class="details-label">Payment Method:</span>
              <span class="details-value">${transaction.procId}</span>
            </div>
            `
                : ''
            }
          </div>
          
          <div class="buttons">
            <form action="/api/v1/dragonpay-dummy/pay/process" method="POST" style="flex:1;display:flex;">
              <input type="hidden" name="txnid" value="${txnid}">
              <input type="hidden" name="status" value="S">
              <button type="submit" class="btn btn-success">✓ Pay Now</button>
            </form>
            <form action="/api/v1/dragonpay-dummy/pay/process" method="POST" style="flex:1;display:flex;">
              <input type="hidden" name="txnid" value="${txnid}">
              <input type="hidden" name="status" value="V">
              <button type="submit" class="btn btn-cancel">✕ Cancel</button>
            </form>
          </div>
          
          <div class="footer">
            This is a dummy payment page for testing purposes only.
          </div>
        </div>
      </body>
      </html>
    `);
  }

  @Post('pay/process')
  @UseInterceptors()
  @ApiOperation({
    summary: 'Process payment from dummy page',
    description: 'Processes payment submission from dummy payment page.',
  })
  processPayment(
    @Body('txnid') txnid: string,
    @Body('status') status: string,
    @Res({ passthrough: false }) res: Response,
  ) {
    const statusEnum =
      status === 'S' ? DragonPayStatusEnum.SUCCESS : DragonPayStatusEnum.VOID;
    const result = this.service.processPaymentFromPage(txnid, statusEnum);
    res.redirect(result.redirectUrl);
  }

  @Get('complete')
  @UseInterceptors()
  @ApiOperation({
    summary: 'Payment completion page',
    description: 'Shows payment completion status.',
  })
  @ApiQuery({ name: 'txnid', type: String })
  @ApiQuery({ name: 'status', type: String })
  showCompletionPage(
    @Query('txnid') txnid: string,
    @Query('status') status: string,
    @Res({ passthrough: false }) res: Response,
  ) {
    const isSuccess = status === 'S';
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment ${isSuccess ? 'Successful' : 'Cancelled'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0; padding: 40px; 
            background: ${isSuccess ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' : 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)'};
            min-height: 100vh; display: flex; align-items: center; justify-content: center;
          }
          .card { 
            background: white; padding: 60px; border-radius: 20px; text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2); max-width: 400px;
          }
          .icon { font-size: 80px; margin-bottom: 20px; }
          h1 { margin: 0 0 10px; color: #333; }
          p { color: #666; margin: 0 0 30px; }
          .txnid { background: #f5f5f5; padding: 10px 20px; border-radius: 8px; 
                   font-family: monospace; color: #333; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">${isSuccess ? '✅' : '❌'}</div>
          <h1>${isSuccess ? 'Payment Successful!' : 'Payment Cancelled'}</h1>
          <p>${isSuccess ? 'Your payment has been processed successfully.' : 'Your payment has been cancelled.'}</p>
          <div class="txnid">${txnid}</div>
        </div>
      </body>
      </html>
    `);
  }
}
