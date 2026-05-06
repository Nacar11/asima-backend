import {
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { IStorageService, StorageConfig } from '../storage.interface';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class S3StorageStrategy implements IStorageService {
  private s3Sdk: S3Client;

  constructor(private config: StorageConfig['config']) {
    this.s3Sdk = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true,
      ...(config.endpoint && { endpoint: config.endpoint }), // MinIO endpoint support
    });
  }

  public async put(file: Express.Multer.File, name: string) {
    const key = `${name}`;
    const safeOriginalName = this.sanitizeMetadataValue(
      file.originalname || 'file',
    );

    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentDisposition: 'inline',
      Metadata: {
        originalName: safeOriginalName,
      },
    });

    try {
      const result = await this.s3Sdk.send(command);
      console.log('S3 upload successful:', result.$metadata);
    } catch (error) {
      console.error('S3 upload failed:', error);
      throw error;
    }

    return {
      url: this.getFileUrl(key).url,
      key,
    };
  }

  public async putBuffer(
    buffer: Buffer,
    name: string,
    contentType: string = 'image/jpeg',
  ) {
    const key = `${name}`;
    const safeOriginalName = this.sanitizeMetadataValue(
      name.split('/').pop() || 'file',
    );

    console.log('S3 putBuffer - Bucket:', this.config.bucket);
    console.log('S3 putBuffer - Key:', key);
    console.log('S3 putBuffer - Buffer size:', buffer.length);
    console.log('S3 putBuffer - Content-Type:', contentType);
    console.log('S3 putBuffer - Endpoint:', this.config.endpoint);

    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ContentDisposition: 'inline',
      Metadata: {
        originalName: safeOriginalName,
      },
    });

    try {
      await this.s3Sdk.send(command);
    } catch (error) {
      console.error('S3 putBuffer failed:', error);
      throw error;
    }

    return {
      url: this.getFileUrl(key).url,
      key,
    };
  }

  public get(key: string) {
    const extractKey = this.extractKeyFromUrl(key) ?? key;
    return Promise.resolve(this.getFileUrl(extractKey));
  }

  public async getFileBuffer(key: string): Promise<Buffer> {
    const extractKey = this.extractKeyFromUrl(key) ?? key;

    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: extractKey,
    });

    const response = await this.s3Sdk.send(command);

    // Convert the stream to a buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  public getFileUrl(key: string) {
    // If custom endpoint (MinIO), use path-style URLs
    if (this.config.endpoint) {
      // Use public endpoint if available, otherwise fall back to internal endpoint
      const endpoint =
        (this.config as any).publicEndpoint || this.config.endpoint;
      return { url: `${endpoint}/${this.config.bucket}/${key}` };
    }
    // Default AWS S3 URL
    return { url: `https://${this.config.bucket}.s3.amazonaws.com/${key}` };
  }

  public async getPresignedUrl(key: string) {
    const extractKey = this.extractKeyFromUrl(key) ?? key;

    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: extractKey,
    });

    const url = await getSignedUrl(this.s3Sdk, command, {
      expiresIn: 60 * 60 * 24, // 24 hours
    });

    return { url };
  }

  public async delete(key: string): Promise<boolean> {
    const extractKey = this.extractKeyFromUrl(key) ?? key;

    const command = new DeleteObjectCommand({
      Bucket: this.config.bucket,
      Key: extractKey,
    });

    await this.s3Sdk.send(command);

    return true;
  }

  public async copy(
    sourceKey: string,
    destKey: string,
  ): Promise<{ url: string; key: string }> {
    const command = new CopyObjectCommand({
      Bucket: this.config.bucket,
      CopySource: `${this.config.bucket}/${sourceKey}`,
      Key: destKey,
    });

    try {
      await this.s3Sdk.send(command);
      console.log(`S3 copy successful: ${sourceKey} → ${destKey}`);
    } catch (error) {
      console.error('S3 copy failed:', error);
      throw error;
    }

    return {
      url: this.getFileUrl(destKey).url,
      key: destKey,
    };
  }

  public async deleteFolder(key: string): Promise<boolean> {
    const extractKey = this.extractKeyFromUrl(key) ?? key;

    const listParams = {
      Bucket: this.config.bucket,
      Prefix: extractKey,
    };

    const listResponse = await this.s3Sdk.send(
      new ListObjectsV2Command(listParams),
    );

    if (listResponse.Contents && listResponse.Contents.length > 0) {
      // Prepare the objects to be deleted
      const deleteParams = {
        Bucket: this.config.bucket,
        Delete: {
          Objects: listResponse.Contents.map((obj) => ({ Key: obj.Key })),
        },
      };

      // Delete the objects
      await this.s3Sdk.send(new DeleteObjectsCommand(deleteParams));
      console.log('Successfully deleted objects in folder:', extractKey);
    } else {
      console.log('No objects found in the folder.');
    }

    return true;
  }

  private extractKeyFromUrl(url: string): string | null {
    // Handle AWS S3 URLs: https://bucket.s3.amazonaws.com/key
    const awsRegex = /https:\/\/[^/]+\.s3\.amazonaws\.com\/(.+)/;
    const awsMatch = url.match(awsRegex);
    if (awsMatch) {
      return awsMatch[1];
    }

    // Handle MinIO/S3-compatible URLs with path-style: http://endpoint/bucket/key
    if (this.config.endpoint) {
      const endpoint =
        (this.config as any).publicEndpoint || this.config.endpoint;
      const endpointRegex = new RegExp(
        `${endpoint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/${this.config.bucket}/(.+)`,
      );
      const endpointMatch = url.match(endpointRegex);
      if (endpointMatch) {
        return endpointMatch[1];
      }
    }

    // If no match, assume the input is already a key
    return null;
  }

  private sanitizeMetadataValue(value: string): string {
    const asciiOnly = value
      .normalize('NFKD')
      .replace(/[^\x20-\x7E]/g, '')
      .trim();
    if (!asciiOnly) return 'file';
    return asciiOnly.length > 200 ? asciiOnly.substring(0, 200) : asciiOnly;
  }
}
