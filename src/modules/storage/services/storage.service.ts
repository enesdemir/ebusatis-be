import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 } from 'uuid';

export interface UploadResult {
  key: string;
  bucket: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
}

/**
 * MinIO/S3 dosya yukleme servisi.
 * Urun gorselleri, uretim medyasi, gumruk evraklari icin kullanilir.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private client: Minio.Client;
  private bucket: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly config: ConfigService) {
    this.client = new Minio.Client({
      endPoint: this.config.get('MINIO_ENDPOINT', 'localhost'),
      port: parseInt(this.config.get('MINIO_PORT', '9000'), 10),
      useSSL: this.config.get('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.config.get('MINIO_ACCESS_KEY', 'ebusatis_minio'),
      secretKey: this.config.get('MINIO_SECRET_KEY', 'ebusatis_minio_secret'),
    });
    this.bucket = this.config.get('MINIO_BUCKET', 'ebusatis-uploads');
  }

  async onModuleInit() {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket);
        // Public read policy (gorsel dosyalar icin)
        const policy = JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'PublicRead',
              Effect: 'Allow',
              Principal: '*',
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucket}/*`],
            },
          ],
        });
        await this.client.setBucketPolicy(this.bucket, policy);
        this.logger.log(`Bucket "${this.bucket}" olusturuldu (public read)`);
      } else {
        this.logger.log(`Bucket "${this.bucket}" mevcut`);
      }
    } catch (err) {
      this.logger.error(`MinIO baglanti hatasi: ${err.message}`);
    }
  }

  /**
   * Dosya yukle.
   * @param file Multer file objesi
   * @param folder Klasor yolu (orn: "products/images", "production/media")
   */
  async upload(
    file: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
      size: number;
    },
    folder = 'uploads',
  ): Promise<UploadResult> {
    const ext = file.originalname.split('.').pop() || 'bin';
    const key = `${folder}/${v4()}.${ext}`;

    await this.client.putObject(this.bucket, key, file.buffer, file.size, {
      'Content-Type': file.mimetype,
      'x-amz-meta-original-name': encodeURIComponent(file.originalname),
    });

    const endpoint = this.config.get('MINIO_ENDPOINT', 'localhost');
    const port = this.config.get('MINIO_PORT', '9000');
    const protocol =
      this.config.get('MINIO_USE_SSL', 'false') === 'true' ? 'https' : 'http';
    const url = `${protocol}://${endpoint}:${port}/${this.bucket}/${key}`;

    return {
      key,
      bucket: this.bucket,
      url,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  /**
   * Birden fazla dosya yukle.
   */
  async uploadMultiple(
    files: Array<{
      buffer: Buffer;
      originalname: string;
      mimetype: string;
      size: number;
    }>,
    folder = 'uploads',
  ): Promise<UploadResult[]> {
    return Promise.all(files.map((f) => this.upload(f, folder)));
  }

  /**
   * Dosya sil.
   */
  async delete(key: string): Promise<void> {
    await this.client.removeObject(this.bucket, key);
  }

  /**
   * Gecici erisim URL'i olustur (private dosyalar icin, 1 saat).
   */
  async getPresignedUrl(key: string, expirySeconds = 3600): Promise<string> {
    return this.client.presignedGetObject(this.bucket, key, expirySeconds);
  }

  /**
   * Klasordeki dosyalari listele.
   */
  async listFiles(
    prefix: string,
  ): Promise<Array<{ name: string; size: number; lastModified: Date }>> {
    return new Promise((resolve, reject) => {
      const files: Array<{ name: string; size: number; lastModified: Date }> =
        [];
      const stream = this.client.listObjects(this.bucket, prefix, true);
      stream.on('data', (obj) => {
        if (obj.name)
          files.push({
            name: obj.name,
            size: obj.size,
            lastModified: obj.lastModified,
          });
      });
      stream.on('end', () => resolve(files));
      stream.on('error', reject);
    });
  }
}
