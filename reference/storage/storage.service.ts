import { Inject, Injectable } from '@nestjs/common';
import {
  IStorageService,
  IUploadFileResponse,
  StorageConfig,
} from './storage.interface';
import { S3StorageStrategy } from './strategies/s3-storage.strategy';
import { STORAGE_CONFIG } from './storage.enum';

@Injectable()
export class StorageService {
  private strategy: IStorageService;

  constructor(@Inject(STORAGE_CONFIG) private config: StorageConfig) {
    this.strategy = this.getStrategy();
  }

  private getStrategy(): IStorageService {
    switch (this.config.provider) {
      case 's3':
        return new S3StorageStrategy(this.config.config);
      default:
        return new S3StorageStrategy(this.config.config);
    }
  }

  async put(
    file: Express.Multer.File,
    name: string,
  ): Promise<IUploadFileResponse> {
    return await this.strategy.put(file, name);
  }

  async putBuffer(
    buffer: Buffer,
    name: string,
    contentType?: string,
  ): Promise<IUploadFileResponse> {
    return await this.strategy.putBuffer(buffer, name, contentType);
  }

  async get(path: string) {
    return await this.strategy.get(path);
  }

  async getFileBuffer(path: string): Promise<Buffer> {
    return await this.strategy.getFileBuffer(path);
  }

  async getPresignedUrl(path: string) {
    if (this.config.provider !== 's3') return '';
    const presigned = await this.strategy.getPresignedUrl(path);
    return presigned?.url;
  }

  async update(file: Express.Multer.File, name: string, path: string) {
    await this.delete(path);
    return this.put(file, name);
  }

  async delete(path: string): Promise<boolean> {
    return await this.strategy.delete(path);
  }

  async deleteFolder(path: string): Promise<boolean> {
    return await this.strategy.deleteFolder(path);
  }

  async copy(sourceKey: string, destKey: string): Promise<IUploadFileResponse> {
    return await this.strategy.copy(sourceKey, destKey);
  }
}
