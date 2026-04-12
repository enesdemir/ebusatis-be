import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import {
  PlatformConfig,
  ConfigCategory,
} from '../modules/admin/entities/platform-config.entity';

interface ConfigSeed {
  key: string;
  value: string;
  category: ConfigCategory;
  valueType: string;
  description?: string;
}

/**
 * Platform configuration seeder.
 *
 * Seeds default configuration keys used across the system:
 *   - Kartela number format
 *   - GSM tolerance
 *   - File upload limits
 *   - SMTP placeholder (override in production)
 *   - PDF template paths
 *   - Notification cron schedules
 *   - Supplier portal token expiry
 *
 * Idempotent — updates value on existing keys rather than erroring.
 */
export class PlatformConfigSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const configs: ConfigSeed[] = [
      {
        key: 'kartela.format',
        value: 'KRT-{YYYY}-{MMDD}-{SEQ}',
        category: ConfigCategory.INVENTORY,
        valueType: 'string',
        description: 'Kartela number format template',
      },
      {
        key: 'inventory.gsm.default_tolerance',
        value: '5',
        category: ConfigCategory.INVENTORY,
        valueType: 'number',
        description: 'Default GSM tolerance percent',
      },
      {
        key: 'file.upload.max_size_mb',
        value: '10',
        category: ConfigCategory.STORAGE,
        valueType: 'number',
        description: 'Maximum uploaded file size in megabytes',
      },
      {
        key: 'file.upload.allowed_types',
        value: 'pdf,jpg,png,webp,xlsx,docx',
        category: ConfigCategory.STORAGE,
        valueType: 'string',
        description: 'Comma-separated allowed file extensions',
      },
      {
        key: 'smtp.host',
        value: 'localhost',
        category: ConfigCategory.EMAIL,
        valueType: 'string',
        description: 'SMTP server host (override in production)',
      },
      {
        key: 'smtp.port',
        value: '1025',
        category: ConfigCategory.EMAIL,
        valueType: 'number',
        description: 'SMTP server port',
      },
      {
        key: 'smtp.from_email',
        value: 'noreply@ebusatis.local',
        category: ConfigCategory.EMAIL,
        valueType: 'string',
        description: 'Default sender email address',
      },
      {
        key: 'pdf.template_path',
        value: './templates/pdf',
        category: ConfigCategory.DOCUMENT,
        valueType: 'string',
        description: 'PDF template directory',
      },
      {
        key: 'notification.delivery_warning_cron',
        value: '0 9 * * *',
        category: ConfigCategory.NOTIFICATIONS,
        valueType: 'string',
        description: 'Cron expression for PO delivery warning notifications',
      },
      {
        key: 'supplier.portal.token_expire_days',
        value: '90',
        category: ConfigCategory.SECURITY,
        valueType: 'number',
        description: 'Supplier portal JWT token expiry in days',
      },
    ];

    for (const c of configs) {
      let cfg = await em.findOne(PlatformConfig, { key: c.key });
      if (!cfg) {
        cfg = new PlatformConfig(c.key, c.value);
        em.persist(cfg);
      } else {
        cfg.value = c.value;
      }
      cfg.category = c.category;
      cfg.valueType = c.valueType;
      if (c.description) cfg.description = c.description;
    }

    await em.flush();
    console.log(`✓ ${configs.length} platform configs seeded`);
  }
}
