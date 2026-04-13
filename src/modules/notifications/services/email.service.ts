import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailAttachment {
  fileName: string;
  content: Buffer;
  contentType?: string;
}

interface EmailMessage {
  to: string;
  subject: string;
  /** Plain-text body. */
  text?: string;
  /** Convenience alias for `text` — used by ScheduledReportService. */
  body?: string;
  /** Optional HTML body — preferred when set. */
  html?: string;
  attachments?: EmailAttachment[];
}

/**
 * Email sending utility.
 *
 * Reads SMTP credentials from `ConfigService` (`SMTP_HOST`,
 * `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`). When
 * credentials are missing the transport falls back to logging the
 * message at INFO level — keeps dev / CI runs noise-free without
 * having to wire an SMTP server.
 *
 * The class is intentionally template-agnostic; the caller renders
 * the body with the simple `{{var}}` interpolation in
 * `renderTemplate` below or any other template engine the team adds
 * later. This keeps Sprint 9 free of a Handlebars / mjml dependency.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly fromAddress: string;
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const portStr = this.config.get<string>('SMTP_PORT');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    this.fromAddress =
      this.config.get<string>('SMTP_FROM') ?? 'noreply@ebusatis.local';

    if (host && portStr) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(portStr),
        secure: this.config.get<string>('SMTP_SECURE') === 'true',
        auth: user && pass ? { user, pass } : undefined,
      });
      this.enabled = true;
      this.logger.log(
        `SMTP transport configured (host=${host}, port=${portStr})`,
      );
    } else {
      this.transporter = null;
      this.enabled = false;
      this.logger.warn(
        'SMTP not configured — email sends will be logged only (set SMTP_HOST/PORT to enable)',
      );
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Send a single email. Returns true on success / log-only path.
   *
   * Errors are swallowed and logged so notification dispatch never
   * fails the parent business operation — emails are best-effort.
   */
  async send(message: EmailMessage): Promise<boolean> {
    const text = message.text ?? message.body;
    if (!this.transporter) {
      this.logger.log(
        `[stub email] to=${message.to} subject="${message.subject}" body=${(
          text ??
          message.html ??
          ''
        ).slice(
          0,
          200,
        )}${message.attachments?.length ? ` attachments=${message.attachments.length}` : ''}`,
      );
      return true;
    }
    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: message.to,
        subject: message.subject,
        text,
        html: message.html,
        attachments: message.attachments?.map((a) => ({
          filename: a.fileName,
          content: a.content,
          contentType: a.contentType,
        })),
      });
      return true;
    } catch (err) {
      this.logger.error(
        `email send failed (to=${message.to}): ${(err as Error).message}`,
      );
      return false;
    }
  }

  /**
   * Render a template using `{{var}}` placeholders.
   *
   * Intentionally trivial — covers the Sprint 9 templates without
   * adding a dependency. Unknown placeholders are left in-place so
   * a missing variable surfaces visually instead of silently
   * vanishing.
   */
  renderTemplate(
    template: string,
    vars: Record<string, string | number>,
  ): string {
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
      const value = vars[key];
      return value === undefined || value === null
        ? `{{${key}}}`
        : String(value);
    });
  }
}
