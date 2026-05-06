/**
 * DragonPay Payout Processor IDs
 * Based on DragonPay Payout API — Appendix 3
 *
 * These are the valid values for the `ProcId` field when creating a payout.
 * NOTE: Collection processor codes (BDOTC, BPITC, etc.) are DIFFERENT from payout codes.
 */
export enum DragonPayPayoutProcessorEnum {
  // ─── Banks (CA/SA) ──────────────────────────────────────────────
  AUB = 'AUB',
  BDO = 'BDO',
  BPI = 'BPI',
  BFB = 'BFB',
  CBC = 'CBC',
  EWB = 'EWB',
  LBP = 'LBP',
  MBTC = 'MBTC',
  PNB = 'PNB',
  RCBC = 'RCBC',
  RSB = 'RSB',
  SBC = 'SBC',
  UBP = 'UBP',
  UCPB = 'UCPB',
  MAY = 'MAY',
  SBA = 'SBA',
  DBP = 'DBP',
  PBCM = 'PBCM',
  PSB = 'PSB',
  PVB = 'PVB',
  BOC = 'BOC',
  CBCS = 'CBCS',
  CTBC = 'CTBC',

  // ─── Cash Pick-up ───────────────────────────────────────────────
  CEBL = 'CEBL',
  LBC = 'LBC',
  PLWN = 'PLWN',
  PRHB = 'PRHB',
  RCBP = 'RCBP',
  RDP = 'RDP',
  TRMY = 'TRMY',

  // ─── E-Wallets ─────────────────────────────────────────────────
  BITC = 'BITC',
  GCSH = 'GCSH',
  SMRT = 'SMRT',
  PYMY = 'PYMY',
}

export interface PayoutProcessorOption {
  procId: string;
  name: string;
  type: 'bank' | 'cash_pickup' | 'ewallet';
  reserved?: boolean;
}

/**
 * Available payout processors with display names.
 * Processors marked `reserved` are listed in the DragonPay spec but
 * may not yet be activated — filter them out if you want to hide them.
 */
export const DRAGONPAY_PAYOUT_PROCESSORS: PayoutProcessorOption[] = [
  // Banks
  { procId: 'AUB', name: 'Asia United Bank', type: 'bank' },
  { procId: 'BDO', name: 'Banco de Oro', type: 'bank' },
  { procId: 'BPI', name: 'BPI', type: 'bank' },
  { procId: 'BFB', name: 'BPI Family Bank', type: 'bank' },
  { procId: 'CBC', name: 'Chinabank', type: 'bank' },
  { procId: 'EWB', name: 'EastWest Bank', type: 'bank' },
  { procId: 'LBP', name: 'Landbank', type: 'bank' },
  { procId: 'MBTC', name: 'Metrobank', type: 'bank' },
  { procId: 'PNB', name: 'PNB', type: 'bank' },
  { procId: 'RCBC', name: 'RCBC', type: 'bank' },
  { procId: 'RSB', name: 'Robinsons Bank', type: 'bank' },
  { procId: 'SBC', name: 'Security Bank', type: 'bank' },
  { procId: 'UBP', name: 'UnionBank', type: 'bank' },
  { procId: 'UCPB', name: 'UCPB', type: 'bank' },
  { procId: 'MAY', name: 'Maybank', type: 'bank' },
  { procId: 'SBA', name: 'Sterling Bank of Asia', type: 'bank' },
  {
    procId: 'DBP',
    name: 'Development Bank of the Philippines',
    type: 'bank',
    reserved: true,
  },
  { procId: 'PBCM', name: 'Philippine Bank of Communications', type: 'bank' },
  { procId: 'PSB', name: 'Philippine Savings Bank', type: 'bank' },
  { procId: 'PVB', name: 'Philippine Veterans Bank', type: 'bank' },
  { procId: 'BOC', name: 'Bank of Commerce', type: 'bank' },
  { procId: 'CBCS', name: 'Chinabank Savings Bank', type: 'bank' },
  { procId: 'CTBC', name: 'Chinatrust', type: 'bank' },

  // Cash Pick-up
  { procId: 'CEBL', name: 'Cebuana Lhuillier', type: 'cash_pickup' },
  { procId: 'LBC', name: 'LBC Cash Pick-up', type: 'cash_pickup' },
  {
    procId: 'PLWN',
    name: 'Palawan Pawnshop',
    type: 'cash_pickup',
    reserved: true,
  },
  { procId: 'PRHB', name: 'PeraHub', type: 'cash_pickup' },
  {
    procId: 'RCBP',
    name: 'RCBC Cash Pick-up',
    type: 'cash_pickup',
    reserved: true,
  },
  { procId: 'RDP', name: 'RD Pawnshop', type: 'cash_pickup', reserved: true },
  { procId: 'TRMY', name: 'TrueMoney', type: 'cash_pickup', reserved: true },

  // E-Wallets
  { procId: 'BITC', name: 'Coins.ph', type: 'ewallet', reserved: true },
  { procId: 'GCSH', name: 'GCash', type: 'ewallet' },
  { procId: 'SMRT', name: 'Smart Money', type: 'ewallet', reserved: true },
  { procId: 'PYMY', name: 'PayMaya', type: 'ewallet' },
];
