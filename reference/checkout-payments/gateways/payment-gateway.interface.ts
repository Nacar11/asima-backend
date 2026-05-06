export interface GatewayInitiateResult {
  gateway: string;
  checkout_url: string | null;
  qr_image_url: string | null;
  reference_number: string | null;
  requires_manual_confirmation: boolean;
}

export interface GatewayContext {
  txnid: string;
  amount: number;
  currency: string;
  description: string;
  email: string;
  customerName?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
  /** Original payment method code (e.g. 'gcash', 'maya_qr', 'custom-42') */
  payment_method_code?: string;
}

export interface PaymentGateway {
  readonly gatewayName: string;
  initiate(context: GatewayContext): Promise<GatewayInitiateResult>;
  supportsManualConfirmation(): boolean;
}
