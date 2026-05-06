export type StorageConfig = {
  provider: string;
  config: {
    accessKeyId?: string;
    secretAccessKey?: string;
    region?: string;
    bucket: string;
    endpoint?: string;
    publicEndpoint?: string;
    basePath?: string;
    azureConnectionString?: string;
    azureContainer?: string;
    gcpProjectId?: string;
    gcpBucket?: string;
    gcpKeyFilename?: string;
  };
};
