import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { PlatformConfig, ConfigCategory } from '../entities/platform-config.entity';

@Injectable()
export class PlatformConfigService {
  constructor(
    @InjectRepository(PlatformConfig)
    private readonly configRepository: EntityRepository<PlatformConfig>,
  ) {}

  /** Returns all configs, optionally filtered by category. */
  async findAll(category?: ConfigCategory): Promise<PlatformConfig[]> {
    const where = category ? { category } : {};
    return this.configRepository.find(where, { orderBy: { category: 'ASC', key: 'ASC' } });
  }

  /** Returns a single config by key. */
  async findByKey(key: string): Promise<PlatformConfig> {
    const config = await this.configRepository.findOne({ key });
    if (!config) {
      throw new NotFoundException(`Config key '${key}' not found`);
    }
    return config;
  }

  /** Creates or updates a config value. */
  async upsert(key: string, value: string, category?: ConfigCategory, description?: string, valueType?: string): Promise<PlatformConfig> {
    const em = this.configRepository.getEntityManager();
    let config = await this.configRepository.findOne({ key });
    if (config) {
      config.value = value;
      if (category) config.category = category;
      if (description !== undefined) config.description = description;
      if (valueType) config.valueType = valueType;
    } else {
      config = new PlatformConfig(key, value);
      if (category) config.category = category;
      if (description) config.description = description;
      if (valueType) config.valueType = valueType;
      em.persist(config);
    }
    await em.flush();
    return config;
  }

  /** Bulk update multiple configs at once. */
  async bulkUpdate(configs: { key: string; value: string }[]): Promise<PlatformConfig[]> {
    const em = this.configRepository.getEntityManager();
    const results: PlatformConfig[] = [];
    for (const item of configs) {
      const config = await this.configRepository.findOne({ key: item.key });
      if (config) {
        config.value = item.value;
        results.push(config);
      }
    }
    await em.flush();
    return results;
  }

  /** Deletes a config entry. */
  async remove(key: string): Promise<void> {
    const config = await this.findByKey(key);
    const em = this.configRepository.getEntityManager();
    await em.removeAndFlush(config);
  }
}
