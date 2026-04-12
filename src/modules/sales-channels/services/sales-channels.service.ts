import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/postgresql';
import { SalesChannel } from '../entities/sales-channel.entity';
import { ChannelProductMapping } from '../entities/channel-product-mapping.entity';
import { ChannelOrder } from '../entities/channel-order.entity';

@Injectable()
export class SalesChannelsService {
  constructor(
    @InjectRepository(SalesChannel)
    private readonly channelRepo: EntityRepository<SalesChannel>,
    @InjectRepository(ChannelProductMapping)
    private readonly mappingRepo: EntityRepository<ChannelProductMapping>,
    @InjectRepository(ChannelOrder)
    private readonly orderRepo: EntityRepository<ChannelOrder>,
    private readonly em: EntityManager,
  ) {}

  async findAllChannels() {
    return this.channelRepo.findAll({ orderBy: { name: 'ASC' } });
  }

  async findChannelById(id: string) {
    const ch = await this.channelRepo.findOne(
      { id },
      { populate: ['productMappings'] },
    );
    if (!ch) throw new NotFoundException('Channel not found');
    return ch;
  }

  async createChannel(data: any) {
    const ch = this.channelRepo.create(data);
    await this.em.persistAndFlush(ch);
    return ch;
  }

  async updateChannel(id: string, data: any) {
    const ch = await this.findChannelById(id);
    Object.assign(ch, data);
    await this.em.flush();
    return ch;
  }

  // Mappings
  async findMappings(channelId: string) {
    return this.mappingRepo.find({ channel: channelId } as any, {
      populate: ['variant', 'channel'],
      orderBy: { createdAt: 'DESC' },
    });
  }

  async createMapping(data: any) {
    const m = this.mappingRepo.create(data);
    await this.em.persistAndFlush(m);
    return m;
  }

  // Orders
  async findChannelOrders(channelId?: string) {
    const where: any = {};
    if (channelId) where.channel = channelId;
    return this.orderRepo.find(where, {
      populate: ['channel'],
      orderBy: { createdAt: 'DESC' },
      limit: 50,
    });
  }
}
