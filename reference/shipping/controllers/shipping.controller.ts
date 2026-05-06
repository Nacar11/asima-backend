import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ShippingService } from '@/shipping/services/shipping.service';
import { CalculateShippingDto } from '@/shipping/dto/calculate-shipping.dto';
import { ShippingRateResponseDto } from '@/shipping/dto/shipping-rate-response.dto';

/**
 * Public controller for shipping rate calculation
 */
@ApiTags('Shipping')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'shipping',
  version: '1',
})
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  /**
   * GET /shipping/methods
   * Get available shipping methods for checkout
   */
  @Get('methods')
  @ApiOperation({
    summary: 'Get available shipping methods',
    description:
      'Returns all active shipping methods from all active providers. Use these to let users select their preferred delivery option at checkout.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of available shipping methods',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Standard Delivery' },
          description: {
            type: 'string',
            example: 'Regular delivery within 1-3 business days',
          },
          base_fee: { type: 'number', example: 30 },
          free_shipping_threshold: { type: 'number', example: 1000 },
          estimated_days: { type: 'string', example: '1-3 business days' },
          provider_id: { type: 'number', example: 1 },
          provider_name: { type: 'string', example: 'In-House Delivery' },
        },
      },
    },
  })
  async getAvailableMethods() {
    return this.shippingService.getAvailableMethods();
  }

  @Post('calculate')
  @ApiOperation({
    summary: 'Calculate shipping rate',
    description:
      'Calculates shipping rate based on seller location, buyer location, items, and order subtotal. Optionally specify shipping_method_id to calculate for a specific method.',
  })
  @ApiResponse({
    status: 200,
    description: 'Shipping rate calculated successfully',
    type: ShippingRateResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid coordinates or delivery exceeds service area',
  })
  @ApiResponse({
    status: 404,
    description: 'No shipping provider or method configured',
  })
  async calculateShipping(
    @Body() dto: CalculateShippingDto,
  ): Promise<ShippingRateResponseDto> {
    return this.shippingService.calculateShipping(dto);
  }
}
