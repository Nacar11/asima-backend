import { NullableType } from '@/utils/types/nullable.type';
export interface StorageConfig {
  provider: 'local' | 's3' | 'azure' | 'gcp';
  config: {
    [key: string]: any;
  };
}

export interface IUploadFileResponse {
  url: any;
  key: string;
}

export interface IFileUrlResponse {
  url: string;
}

export interface IStorageService {
  put(file: Express.Multer.File, name: string): Promise<IUploadFileResponse>;
  putBuffer(
    buffer: Buffer,
    name: string,
    contentType?: string,
  ): Promise<IUploadFileResponse>;
  get(key: string): Promise<Buffer | string | IFileUrlResponse>;
  getFileBuffer(key: string): Promise<Buffer>;
  delete(key: string): Promise<boolean>;
  getFileUrl(key: string): IFileUrlResponse;
  getPresignedUrl(key: string): Promise<NullableType<IFileUrlResponse>>;
  deleteFolder(key: string): Promise<boolean>;
  copy(sourceKey: string, destKey: string): Promise<IUploadFileResponse>;
}
