import { ShippingCalculatorService } from './shipping-calculator.service';

describe('ShippingCalculatorService', () => {
  let service: ShippingCalculatorService;

  beforeEach(() => {
    service = new ShippingCalculatorService();
  });

  it('should return 0 shipping_amount for FREE methods even if minimum_fee is set', () => {
    const method = {
      base_fee: 0,
      rate_per_km: null,
      rate_per_kg: null,
      minimum_fee: 566.65,
      volumetric_divisor: 5000,
      free_shipping_threshold: null,
      free_shipping_max_weight_kg: null,
      distance_tiers: [],
    } as any;

    const result = service.calculate({
      method,
      distanceKm: 10,
      subtotal: 1500,
      items: [
        {
          quantity: 1,
          weight_kg: 1,
        },
      ],
    });

    expect(result.shipping_amount).toBe(0);
    expect(result.is_free_shipping).toBe(true);
  });

  it('should still applies minimum_fee when method has fee configuration', () => {
    const method = {
      base_fee: 0,
      rate_per_km: 10,
      rate_per_kg: null,
      minimum_fee: 50,
      volumetric_divisor: 5000,
      free_shipping_threshold: null,
      free_shipping_max_weight_kg: null,
      distance_tiers: [],
    } as any;

    const result = service.calculate({
      method,
      distanceKm: 1,
      subtotal: 1500,
      items: [
        {
          quantity: 1,
          weight_kg: 1,
        },
      ],
    });

    expect(result.shipping_amount).toBe(50);
    expect(result.is_free_shipping).toBe(false);
  });

  it('should return 0 shipping_amount when free_shipping_threshold is met', () => {
    const method = {
      base_fee: 100,
      rate_per_km: 10,
      rate_per_kg: 20,
      minimum_fee: 50,
      volumetric_divisor: 5000,
      free_shipping_threshold: 1000,
      free_shipping_max_weight_kg: 10,
      distance_tiers: [],
    } as any;

    const result = service.calculate({
      method,
      distanceKm: 1,
      subtotal: 1500,
      items: [
        {
          quantity: 1,
          weight_kg: 1,
        },
      ],
    });

    expect(result.shipping_amount).toBe(0);
    expect(result.is_free_shipping).toBe(true);
  });
});
