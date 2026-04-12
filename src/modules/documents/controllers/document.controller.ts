import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { DocumentService } from '../services/document.service';
import { CreateDocumentDto } from '../dto/create-document.dto';
import { ReplaceDocumentDto } from '../dto/replace-document.dto';
import { ListDocumentsQueryDto } from '../dto/list-documents-query.dto';

interface AuthenticatedRequest extends ExpressRequest {
  user?: {
    sub?: string;
    id?: string;
    [key: string]: unknown;
  };
}

interface MulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

/**
 * Document controller.
 *
 * CLAUDE.md compliance:
 *   - JwtAuthGuard + TenantGuard on every endpoint.
 *   - All inputs go through class-validator DTOs.
 *   - Errors raised by the service carry error code + i18n key so the
 *     global envelope / frontend i18n contract stays intact.
 */
@Controller('documents')
@UseGuards(JwtAuthGuard, TenantGuard)
export class DocumentController {
  constructor(private readonly service: DocumentService) {}

  @Get()
  findByEntity(@Query() query: ListDocumentsQueryDto) {
    return this.service.findByEntity(
      query.entityType,
      query.entityId,
      query.includeHistory === 'true',
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/download')
  download(@Param('id') id: string) {
    return this.service.getDownloadUrl(id);
  }

  @Get(':id/versions')
  versions(@Param('id') id: string) {
    return this.service.findVersionChain(id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Body() dto: CreateDocumentDto,
    @UploadedFile() file: MulterFile,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.upload(dto, file, req.user?.sub);
  }

  @Post(':id/replace')
  @UseInterceptors(FileInterceptor('file'))
  replace(
    @Param('id') id: string,
    @Body() dto: ReplaceDocumentDto,
    @UploadedFile() file: MulterFile,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.replaceVersion(
      id,
      file,
      dto.description,
      req.user?.sub,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
