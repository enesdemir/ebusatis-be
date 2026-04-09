import {
  Controller, Post, Delete, Get, Param, Query,
  UseGuards, UseInterceptors, UploadedFile, UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { StorageService, UploadResult } from '../services/storage.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  /**
   * Tek dosya yukle.
   * POST /api/storage/upload?folder=products/images
   * Body: multipart/form-data, field: "file"
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } })) // 10MB limit
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ): Promise<UploadResult> {
    return this.storageService.upload(file, folder || 'uploads');
  }

  /**
   * Birden fazla dosya yukle (max 10).
   * POST /api/storage/upload-multiple?folder=production/media
   * Body: multipart/form-data, field: "files"
   */
  @Post('upload-multiple')
  @UseInterceptors(FilesInterceptor('files', 10, { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') folder?: string,
  ): Promise<UploadResult[]> {
    return this.storageService.uploadMultiple(files, folder || 'uploads');
  }

  /**
   * Dosya sil.
   * DELETE /api/storage/:key
   */
  @Delete(':key(*)')
  async deleteFile(@Param('key') key: string): Promise<{ success: boolean }> {
    await this.storageService.delete(key);
    return { success: true };
  }

  /**
   * Gecici URL al (private dosyalar icin).
   * GET /api/storage/presigned/:key
   */
  @Get('presigned/:key(*)')
  async getPresignedUrl(@Param('key') key: string): Promise<{ url: string }> {
    const url = await this.storageService.getPresignedUrl(key);
    return { url };
  }

  /**
   * Klasordeki dosyalari listele.
   * GET /api/storage/list?prefix=products/images/
   */
  @Get('list')
  async listFiles(@Query('prefix') prefix: string) {
    return this.storageService.listFiles(prefix || '');
  }
}
