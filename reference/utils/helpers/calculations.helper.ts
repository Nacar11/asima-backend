/**
 * Interface for selected option with duration adjustment
 */
export interface SelectedOptionDuration {
  duration_adjustment_minutes: number;
  quantity?: number;
}

/**
 * Interface for selected addon with duration
 */
export interface SelectedAddonDuration {
  duration_minutes: number | null;
  quantity: number;
}

/**
 * Calculates the total service duration including base duration,
 * variant option adjustments, and add-on durations.
 *
 * Formula:
 * Total Duration = Base Duration
 *                + Σ(Selected Option duration_adjustment_minutes × quantity)
 *                + Σ(Add-on duration_minutes × quantity)
 *
 * @param baseDurationMinutes - The service's base estimated_duration_minutes
 * @param selectedOptions - Array of selected variant options with duration adjustments
 * @param selectedAddons - Array of selected add-ons with duration and quantity
 * @returns Total duration in minutes
 */
export function calculateServiceDuration(
  baseDurationMinutes: number,
  selectedOptions: SelectedOptionDuration[] = [],
  selectedAddons: SelectedAddonDuration[] = [],
): number {
  // Start with base duration
  let totalDuration = baseDurationMinutes || 60; // Default to 60 min if not set

  // Add variant option duration adjustments
  for (const option of selectedOptions) {
    const adjustment = option.duration_adjustment_minutes || 0;
    const quantity = option.quantity || 1;
    totalDuration += adjustment * quantity;
  }

  // Add add-on durations
  for (const addon of selectedAddons) {
    const duration = addon.duration_minutes || 0;
    const quantity = addon.quantity || 1;
    totalDuration += duration * quantity;
  }

  // Ensure minimum duration of 15 minutes
  return Math.max(totalDuration, 15);
}

export function calculateTotalAmount(items: { item_total_amount: number }[]) {
  const totalAmount = items.reduce((sum, { item_total_amount }) => {
    const cleanedItemTotal = isNaN(item_total_amount) ? 0 : item_total_amount;
    return sum + cleanedItemTotal;
  }, 0);

  const formattedTotalAmount = parseFloat(totalAmount.toString()); // Explicitly cast to number

  return parseFloat(formattedTotalAmount.toFixed(2));
}

/**
 * Calculates Purchase Order's SubTotal, VatInc, Total discount, Total Amount
 * @param data - Purchase Order object
 * @returns returns PO total summary = { subTotal: Number, vatInc: Number, totalDisc: Number, total: Number }
 */
export function getPurchaseOrderVatDiscountTotal(data: any) {
  const summary = {
    subTotal: 0,
    vatInc: 0,
    totalDisc: 0,
    total: 0,
  };

  data.items.forEach((item) => {
    let vatExUnitPrice = 0;
    let vatExTotal = 0;
    let discountAmount = 0;
    let subTotal = 0;
    let vatAmount = 0;
    let total = 0;
    const vatInNumeric = 1 + item.vat / 100;
    const discount = item.discount / 100;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    vatExUnitPrice = item.unit_price * vatInNumeric;
    vatExTotal = (item.unit_price * item.po_qty) / vatInNumeric;
    discountAmount = vatExTotal * discount;
    subTotal = vatExTotal - vatExTotal * discount;
    vatAmount = subTotal * vatInNumeric;
    total = subTotal + vatAmount;
    summary.subTotal = summary.subTotal + subTotal;
    summary.vatInc = summary.vatInc + vatAmount;
    summary.totalDisc = summary.totalDisc + discountAmount;
    summary.total = summary.total + total;
  });

  return summary;
}
