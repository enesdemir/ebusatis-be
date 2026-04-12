import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { TenantContext } from '../../../common/context/tenant.context';
import { TenantContextMissingException } from '../../../common/errors/app.exceptions';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entity';
import {
  Document,
  DocumentCategory,
  DocumentType,
} from '../entities/document.entity';
import { StorageService } from '../../storage/services/storage.service';
import { CreateDocumentDto } from '../dto/create-document.dto';

/** Max bytes allowed on a single upload (guide §24 — 10 MB). */
const MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Mime types accepted for user uploads. */
const ALLOWED_MIMES = new Set<string>([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/msword', // doc
  'application/vnd.ms-excel', // xls
]);

interface MulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

/**
 * Document service.
 *
 * Owns the upload / download / versioning flow for every file
 * attached to a business entity. Uploads land in MinIO via
 * `StorageService`; the metadata row is persisted under the current
 * tenant (defense-in-depth check against `TenantContext`).
 *
 * Errors use framework HttpExceptions with structured payloads so the
 * global response envelope carries an error code + i18n key.
 */
@Injectable()
export class DocumentService {
  constructor(
    private readonly em: EntityManager,
    private readonly storage: StorageService,
  ) {}

  // ── Validation ──────────────────────────────────────────────

  private validateFile(file: MulterFile): void {
    if (!file) {
      throw new BadRequestException({
        errorCode: 'DOCUMENT_FILE_REQUIRED',
        i18nKey: 'errors.document.fileRequired',
      });
    }
    if (file.size > MAX_FILE_BYTES) {
      throw new PayloadTooLargeException({
        errorCode: 'DOCUMENT_FILE_TOO_LARGE',
        i18nKey: 'errors.document.fileTooLarge',
        maxBytes: MAX_FILE_BYTES,
      });
    }
    if (!ALLOWED_MIMES.has(file.mimetype)) {
      throw new UnsupportedMediaTypeException({
        errorCode: 'DOCUMENT_UNSUPPORTED_MIME',
        i18nKey: 'errors.document.unsupportedMime',
        mimeType: file.mimetype,
      });
    }
  }

  // ── Upload ──────────────────────────────────────────────────

  /**
   * Register a brand-new user upload against a business entity.
   *
   * The file is pushed to MinIO first (so a DB flush never leaves a
   * dangling row), then a Document row is persisted with the returned
   * storage key.
   */
  async upload(
    dto: CreateDocumentDto,
    file: MulterFile,
    userId?: string,
  ): Promise<Document> {
    this.validateFile(file);

    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });

    const upload = await this.storage.upload(file, `documents/${tenantId}`);

    const doc = this.em.create(Document, {
      tenant,
      category: DocumentCategory.USER_UPLOADED,
      documentType: dto.documentType,
      entityType: dto.entityType,
      entityId: dto.entityId,
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      storageKey: upload.key,
      description: dto.description,
      tags: dto.tags,
      uploadedBy: userId ? this.em.getReference(User, userId) : undefined,
      uploadedAt: new Date(),
    } as unknown as Document);
    this.em.persist(doc);
    await this.em.flush();
    return doc;
  }

  /**
   * Register a system-generated document (e.g. a PDF produced by the
   * rendering engine in Sprint 7). The buffer is uploaded exactly
   * like a user file but marked `SYSTEM_GENERATED` so the UI can
   * group it under the "system documents" pane.
   */
  async registerSystemDocument(params: {
    entityType: string;
    entityId: string;
    documentType: DocumentType;
    fileName: string;
    mimeType: string;
    buffer: Buffer;
    description?: string;
  }): Promise<Document> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });

    const upload = await this.storage.upload(
      {
        buffer: params.buffer,
        originalname: params.fileName,
        mimetype: params.mimeType,
        size: params.buffer.length,
      },
      `documents/${tenantId}/system`,
    );

    const doc = this.em.create(Document, {
      tenant,
      category: DocumentCategory.SYSTEM_GENERATED,
      documentType: params.documentType,
      entityType: params.entityType,
      entityId: params.entityId,
      fileName: params.fileName,
      mimeType: params.mimeType,
      fileSize: params.buffer.length,
      storageKey: upload.key,
      description: params.description,
      uploadedAt: new Date(),
    } as unknown as Document);
    this.em.persist(doc);
    await this.em.flush();
    return doc;
  }

  // ── Read ────────────────────────────────────────────────────

  async findByEntity(
    entityType: string,
    entityId: string,
    includeHistory = false,
  ): Promise<Document[]> {
    const where: Record<string, unknown> = { entityType, entityId };
    if (!includeHistory) where.replacedBy = null;
    return this.em.find(Document, where, {
      populate: ['uploadedBy'] as never[],
      orderBy: { uploadedAt: 'DESC' } as never,
    });
  }

  async findOne(id: string): Promise<Document> {
    const doc = await this.em.findOne(Document, { id });
    if (!doc) {
      throw new NotFoundException({
        errorCode: 'DOCUMENT_NOT_FOUND',
        i18nKey: 'errors.document.notFound',
      });
    }
    return doc;
  }

  /**
   * Produce a short-lived signed URL (10 min) so the browser can
   * download the file directly from MinIO without exposing the
   * bucket publicly.
   */
  async getDownloadUrl(id: string): Promise<{
    url: string;
    fileName: string;
    mimeType: string;
  }> {
    const doc = await this.findOne(id);
    const url = await this.storage.getPresignedUrl(doc.storageKey, 600);
    return { url, fileName: doc.fileName, mimeType: doc.mimeType };
  }

  // ── Versioning ──────────────────────────────────────────────

  /**
   * Replace a document with a newer version.
   *
   * The old row stays in the database (so audit and rollbacks work)
   * but gets its `replacedBy` pointer set to the newly created row.
   * `version` increments relative to the old head.
   */
  async replaceVersion(
    id: string,
    file: MulterFile,
    description: string | undefined,
    userId?: string,
  ): Promise<Document> {
    this.validateFile(file);

    const old = await this.findOne(id);
    if (old.replacedBy) {
      throw new BadRequestException({
        errorCode: 'DOCUMENT_ALREADY_REPLACED',
        i18nKey: 'errors.document.alreadyReplaced',
      });
    }

    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });

    const upload = await this.storage.upload(file, `documents/${tenantId}`);

    const fresh = this.em.create(Document, {
      tenant,
      category: old.category,
      documentType: old.documentType,
      entityType: old.entityType,
      entityId: old.entityId,
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      storageKey: upload.key,
      version: old.version + 1,
      description: description ?? old.description,
      tags: old.tags,
      uploadedBy: userId ? this.em.getReference(User, userId) : undefined,
      uploadedAt: new Date(),
    } as unknown as Document);
    this.em.persist(fresh);

    old.replacedBy = fresh;
    await this.em.flush();
    return fresh;
  }

  async findVersionChain(id: string): Promise<Document[]> {
    const head = await this.findOne(id);
    const chain: Document[] = [head];
    let cursor: Document | undefined = head.replacedBy
      ? ((await this.em.findOne(Document, {
          id: head.replacedBy.id,
        })) ?? undefined)
      : undefined;
    while (cursor) {
      chain.push(cursor);
      cursor = cursor.replacedBy
        ? ((await this.em.findOne(Document, {
            id: cursor.replacedBy.id,
          })) ?? undefined)
        : undefined;
    }
    return chain;
  }

  // ── Delete ──────────────────────────────────────────────────

  /**
   * Remove a document row and its object-storage blob.
   *
   * Only leaf (non-superseded) versions may be hard-deleted;
   * replaced rows are kept for audit — if the caller wants to prune
   * history, they walk the chain and delete leaves first.
   */
  async remove(id: string): Promise<void> {
    const doc = await this.findOne(id);
    if (doc.replacedBy) {
      throw new BadRequestException({
        errorCode: 'DOCUMENT_HAS_NEWER_VERSION',
        i18nKey: 'errors.document.hasNewerVersion',
      });
    }
    await this.storage.delete(doc.storageKey);
    await this.em.removeAndFlush(doc);
  }
}
