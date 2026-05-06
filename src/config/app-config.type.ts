export type AppConfig = {
  nodeEnv: string;
  name: string;
  port: number;
  apiPrefix: string;
  frontendDomain?: string;
  corsAllowedOrigins?: string;
};
