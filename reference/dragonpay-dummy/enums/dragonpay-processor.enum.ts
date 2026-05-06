/**
 * DragonPay Processor IDs
 * Based on DragonPay Payment Switch API v2.26
 */
export enum DragonPayProcessorEnum {
  GCASH = 'GCSH',
  PAYMAYA = 'PYMY',
  GRABPAY = 'GRAB',
  SHOPEEPAY = 'SHOP',
  BPI = 'BPI',
  BDO = 'BDO',
  UNION_BANK = 'UBPH',
  METROBANK = 'MBTC',
  INSTAPAY = 'INPY',
  PESONET = 'PSNT',
  BAYAD_CENTER = 'BAYD',
  CEBUANA = 'CEBL',
  MLHUILLIER = 'MLH',
  SEVEN_ELEVEN = '711',
  ECPAY = 'ECP',
}

/**
 * Currency codes supported by DragonPay
 */
export enum DragonPayCurrencyEnum {
  PHP = 'PHP',
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  JPY = 'JPY',
  CNY = 'CNY',
}

/**
 * Payment mode types
 */
export enum DragonPayModeEnum {
  ONLINE = 'online',
  OFFLINE = 'offline',
}
