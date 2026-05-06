import { Injectable } from '@nestjs/common';
import { ShippingMethod } from '@/shipping/domain/shipping-method';
import { ShippingDistanceTier } from '@/shipping/domain/shipping-distance-tier';
import { ShippingItemDto } from '@/shipping/dto/calculate-shipping.dto';

export interface ShippingCalculationInput {
  method: ShippingMethod;
  distanceKm: number;
  items: ShippingItemDto[];
  subtotal: number;
}

export interface ShippingCalculationResult {
  shipping_amount: number;
  chargeable_weight_kg: number;
  is_free_shipping: boolean;
  breakdown: {
    base_fee: number;
    distance_fee: number;
    weight_fee: number;
    subtotal: number;
    minimum_fee: number;
    final_amount: number;
  };
}

/**
 * Service for calculating shipping rates based on method configuration
 */
@Injectable()
export class ShippingCalculatorService {
  /**
   * Calculate shipping rate based on method, distance, and items
   */
  calculate(input: ShippingCalculationInput): ShippingCalculationResult {
    const { method, distanceKm, items, subtotal } = input;

    // Calculate chargeable weight (max of actual vs volumetric)
    const chargeableWeight = this.calculateChargeableWeight(
      items,
      method.volumetric_divisor,
    );

    // Check for free shipping:
    // 1. Subtotal must meet threshold (if set)
    // 2. Weight must be under max limit (if set)
    const meetsSubtotalThreshold =
      method.free_shipping_threshold != null &&
      subtotal >= method.free_shipping_threshold;

    const meetsWeightLimit =
      method.free_shipping_max_weight_kg == null ||
      chargeableWeight <= method.free_shipping_max_weight_kg;

    if (meetsSubtotalThreshold && meetsWeightLimit) {
      return {
        shipping_amount: 0,
        chargeable_weight_kg: Math.round(chargeableWeight * 1000) / 1000,
        is_free_shipping: true,
        breakdown: {
          base_fee: 0,
          distance_fee: 0,
          weight_fee: 0,
          subtotal: 0,
          minimum_fee: method.minimum_fee,
          final_amount: 0,
        },
      };
    }

    const baseFee = method.base_fee;
    let distanceFee = 0;
    let weightFee = 0;

    // Calculate distance fee based on calculation type or method settings
    if (method.distance_tiers && method.distance_tiers.length > 0) {
      // Use tier-based pricing
      distanceFee = this.calculateTierBasedFee(
        distanceKm,
        method.distance_tiers,
      );
    } else if (method.rate_per_km != null) {
      // Use per-km rate
      distanceFee = distanceKm * method.rate_per_km;
    }

    // Calculate weight fee
    if (method.rate_per_kg != null) {
      weightFee = chargeableWeight * method.rate_per_kg;
    }

    // Calculate subtotal
    const calculatedSubtotal = baseFee + distanceFee + weightFee;

    // Apply minimum fee only if there are actual fees configured
    // For FREE shipping methods (base_fee=0, no rates), minimum_fee should not apply
    const hasFeeConfiguration =
      baseFee > 0 ||
      method.rate_per_km != null ||
      method.rate_per_kg != null ||
      (method.distance_tiers && method.distance_tiers.length > 0);

    const finalAmount = hasFeeConfiguration
      ? Math.max(calculatedSubtotal, method.minimum_fee)
      : calculatedSubtotal;

    // Round to 2 decimal places
    const roundedAmount = Math.round(finalAmount * 100) / 100;

    const isFreeShippingMethod = !hasFeeConfiguration && roundedAmount === 0;

    return {
      shipping_amount: roundedAmount,
      chargeable_weight_kg: Math.round(chargeableWeight * 1000) / 1000,
      is_free_shipping: isFreeShippingMethod,
      breakdown: {
        base_fee: Math.round(baseFee * 100) / 100,
        distance_fee: Math.round(distanceFee * 100) / 100,
        weight_fee: Math.round(weightFee * 100) / 100,
        subtotal: Math.round(calculatedSubtotal * 100) / 100,
        minimum_fee: method.minimum_fee,
        final_amount: roundedAmount,
      },
    };
  }

  /**
   * Calculate chargeable weight (max of actual weight vs volumetric weight)
   */
  private calculateChargeableWeight(
    items: ShippingItemDto[],
    volumetricDivisor: number,
  ): number {
    let totalActualWeight = 0;
    let totalVolumetricWeight = 0;

    for (const item of items) {
      const quantity = item.quantity;

      // Calculate actual weight
      totalActualWeight += item.weight_kg * quantity;

      // Calculate volumetric weight if dimensions are provided
      if (item.length_cm && item.width_cm && item.height_cm) {
        const volumetricWeight =
          (item.length_cm * item.width_cm * item.height_cm) / volumetricDivisor;
        totalVolumetricWeight += volumetricWeight * quantity;
      }
    }

    // Return the higher of actual or volumetric weight
    return Math.max(totalActualWeight, totalVolumetricWeight);
  }

  /**
   * Calculate distance fee based on tiers
   */
  private calculateTierBasedFee(
    distanceKm: number,
    tiers: ShippingDistanceTier[],
  ): number {
    // Sort tiers by min_distance_km ascending
    const sortedTiers = [...tiers].sort(
      (a, b) => a.min_distance_km - b.min_distance_km,
    );

    // Find the matching tier
    for (const tier of sortedTiers) {
      const inMinRange = distanceKm >= tier.min_distance_km;
      const inMaxRange =
        tier.max_distance_km == null || distanceKm < tier.max_distance_km;

      if (inMinRange && inMaxRange) {
        return tier.fee;
      }
    }

    // If no tier matches, use the last tier (unlimited range)
    const lastTier = sortedTiers[sortedTiers.length - 1];
    if (lastTier) {
      return lastTier.fee;
    }

    return 0;
  }
}
