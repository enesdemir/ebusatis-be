import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * SMS sending utility.
 *
 * Reads Twilio credentials lazily from `ConfigService`
 * (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`). The
 * twilio package is intentionally NOT a hard dependency for Sprint 9
 * — when credentials are present we `require()` it dynamically and
 * use the real client; otherwise the service logs the message and
 * returns success. This keeps dev / CI builds light and lets
 * tenants opt-in by simply setting env vars and `pnpm add twilio`.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly enabled: boolean;
  private readonly fromNumber?: string;
  private client: {
    messages: { create: (opts: unknown) => Promise<unknown> };
  } | null = null;

  constructor(private readonly config: ConfigService) {
    const sid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const token = this.config.get<string>('TWILIO_AUTH_TOKEN');
    this.fromNumber = this.config.get<string>('TWILIO_FROM');
    this.enabled = Boolean(sid && token && this.fromNumber);

    if (!this.enabled) {
      this.logger.warn(
        'Twilio not configured — SMS sends will be logged only (set TWILIO_* env vars to enable)',
      );
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async send(toPhone: string, body: string): Promise<boolean> {
    if (!this.enabled) {
      this.logger.log(`[stub sms] to=${toPhone} body=${body.slice(0, 160)}`);
      return true;
    }
    try {
      // Lazy load — the twilio package is optional.
      if (!this.client) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
        const twilio = require('twilio') as (
          sid: string,
          token: string,
        ) => {
          messages: { create: (opts: unknown) => Promise<unknown> };
        };
        this.client = twilio(
          this.config.get<string>('TWILIO_ACCOUNT_SID') as string,
          this.config.get<string>('TWILIO_AUTH_TOKEN') as string,
        );
      }
      await this.client.messages.create({
        from: this.fromNumber,
        to: toPhone,
        body,
      });
      return true;
    } catch (err) {
      this.logger.error(
        `sms send failed (to=${toPhone}): ${(err as Error).message}`,
      );
      return false;
    }
  }
}
