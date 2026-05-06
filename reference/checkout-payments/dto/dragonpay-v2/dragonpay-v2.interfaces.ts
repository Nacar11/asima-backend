/**
 * Raw DragonPay V2 Collect API response (PascalCase from API)
 */
export interface DragonPayV2RawCollectResponse {
  RefNo: string;
  Status: string; // 'S' = success initiation, 'F' = failed initiation
  Message: string;
  Url?: string;
  QRPH?: string; // For ABQR procId only
}

/**
 * Raw DragonPay V2 transaction status response (PascalCase from API)
 */
export interface DragonPayV2RawStatusResponse {
  RefNo: string;
  MerchantId: string;
  TxnId: string;
  RefDate: string;
  Amount: number;
  Currency: string;
  Description: string;
  Status: string;
  Email: string;
  MobileNo?: string;
  ProcId?: string;
  ProcMsg?: string;
  SettleDate?: string;
  Param1?: string;
  Param2?: string;
  Fee?: number;
}

/**
 * Raw DragonPay V2 public key response
 */
export interface DragonPayV2PublicKey {
  value: string;
  status: 'Active' | 'Revoked';
}

/**
 * Normalized payment result (internal use)
 */
export interface DragonPayV2PaymentResult {
  txnid: string;
  refNo: string;
  status: string;
  message: string;
  url?: string;
}

/**
 * Normalized payout result (internal use)
 */
export interface DragonPayV2PayoutResult {
  txnId: string;
  refNo: string;
  status: string;
  message: string;
}

/**
 * Normalized transaction status (internal use)
 */
export interface DragonPayV2TransactionStatus {
  refNo: string;
  merchantId: string;
  txnId: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  email: string;
  procId?: string;
  procMsg?: string;
  settleDate?: string;
  fee?: number;
}

/**
 * Raw DragonPay Payout API status response (PascalCase from API)
 * Endpoint: GET {payoutUrl}/{merchantId}/{txnId}
 */
export interface DragonPayV2RawPayoutStatusResponse {
  RefNo: string;
  MerchantId: string;
  MerchantTxnId: string;
  Amount: number;
  Currency: string;
  Description: string;
  Status: string;
  ProcId?: string;
  ProcDetail?: string;
  ProcMsg?: string;
  SettleDate?: string;
  Fee?: number;
}

/**
 * Normalized payout status (internal use)
 */
export interface DragonPayV2PayoutStatus {
  refNo: string;
  merchantTxnId: string;
  amount: number;
  currency: string;
  status: string;
  procId?: string;
  procMsg?: string;
  settleDate?: string;
}

/**
 * DragonPay status codes (from Appendix 3)
 */
export enum DragonPayStatusCode {
  SUCCESS = 'S',
  FAILURE = 'F',
  PENDING = 'P',
  UNKNOWN = 'U',
  VOID = 'V',
}

/**
 * Processor map: internal payment method code -> DragonPay procId
 */
export const DRAGONPAY_PROCESSOR_MAP: Record<string, string> = {
  gcash: 'GCSH',
  maya: 'PYMY',
  paymaya: 'PYMY',
  paymaya_direct: 'PYMY',
  grabpay: 'GRAB',
  shopeepay: 'SHPE',
  bpi: 'BPI',
  bdo: 'BDO',
  unionbank: 'UBP',
  metrobank: 'MBTC',
  instapay: 'INST',
  pesonet: 'PESO',
  '7eleven': '7ELE',
  bayad: 'BAYD',
  cebuana: 'CEBL',
  mlhuillier: 'MLH',
  ecpay: 'ECPY',
  credit_card: 'CC',
  rcbc: 'RCBC',
  chinabank: 'CBC',
  pnb: 'PNB',
  gcash_dp: 'GCSH',
  bank_account: 'BOG',
  bog: 'BOG',
  bogx: 'BOGX',
};
