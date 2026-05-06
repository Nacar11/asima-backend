export type MailConfig = {
  port: number;
  host?: string;
  user?: string;
  password?: string;
  logoUrl?: string;
  defaultEmail?: string;
  defaultName?: string;
  ignoreTLS: boolean;
  secure: boolean;
  requireTLS: boolean;
  rejectUnauthorized: boolean;
  // Timeout settings (in milliseconds)
  connectionTimeout: number;
  greetingTimeout: number;
  socketTimeout: number;
  // Pooling settings
  pool: boolean;
  maxConnections: number;
  maxMessages: number;
};
