export type AuthConfig = {
  secret?: string;
  expires?: string;
  refreshSecret?: string;
  refreshExpires?: string;
  forgotSecret?: string;
  forgotExpires?: string;
  confirmEmailSecret?: string;
  confirmEmailExpires?: string;
  invoiceDownloadSecret?: string;
  invoiceDownloadExpires?: string;
};
