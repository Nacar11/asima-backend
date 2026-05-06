/**
 * Shipping provider type enum
 * Determines the type of shipping provider
 */
export enum ProviderType {
  /** Company-operated delivery service */
  IN_HOUSE = 'in_house',

  /** Third-party courier (e.g., J&T, LBC) */
  THIRD_PARTY = 'third_party',

  /** API-integrated carrier (e.g., DHL, FedEx) */
  API_CARRIER = 'api_carrier',
}

/**
 * Shipping zone area type enum
 * Determines the geographic level of the area
 */
export enum AreaType {
  /** Country level (e.g., "PH") */
  COUNTRY = 'country',

  /** Region level (e.g., "Region VII") */
  REGION = 'region',

  /** Province level (e.g., "Cebu") */
  PROVINCE = 'province',

  /** City level (e.g., "Cebu City") */
  CITY = 'city',

  /** Postal code level (e.g., "6000") */
  POSTAL_CODE = 'postal_code',
}
