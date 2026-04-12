import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  EntityRepository,
  EntityManager,
  FilterQuery,
} from '@mikro-orm/postgresql';
import { SalesChannel } from '../entities/sales-channel.entity';
import { ChannelProductMapping } from '../entities/channel-product-mapping.entity';
import { ChannelOrder } from '../entities/channel-order.entity';
import { EntityNotFoundException } from '../../../common/errors/app.exceptions';
import { CreateChannelDto } from '../dto/create-channel.dto';
import { UpdateChannelDto } from '../dto/update-channel.dto';
import { CreateChannelMappingDto } from '../dto/create-channel-mapping.dto';

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
    if (!ch) throw new EntityNotFoundException('SalesChannel', id);
    return ch;
  }

  async createChannel(data: CreateChannelDto) {
    const ch = this.channelRepo.create(data as unknown as SalesChannel);
    await this.em.persistAndFlush(ch);
    return ch;
  }

  async updateChannel(id: string, data: UpdateChannelDto) {
    const ch = await this.findChannelById(id);
    Object.assign(ch, data);
    await this.em.flush();
    return ch;
  }

  // Mappings
  async findMappings(channelId: string) {
    return this.mappingRepo.find(
      { channel: channelId } as FilterQuery<ChannelProductMapping>,
      {
        populate: ['variant', 'channel'],
        orderBy: { createdAt: 'DESC' },
      },
    );
  }

  async createMapping(data: CreateChannelMappingDto) {
    const m = this.mappingRepo.create(data as unknown as ChannelProductMapping);
    await this.em.persistAndFlush(m);
    return m;
  }

  // Orders
  async findChannelOrders(channelId?: string) {
    const where: FilterQuery<ChannelOrder> = {};
    if (channelId) (where as Record<string, unknown>).channel = channelId;
    return this.orderRepo.find(where, {
      populate: ['channel'],
      orderBy: { createdAt: 'DESC' },
      limit: 50,
    });
  }
}
