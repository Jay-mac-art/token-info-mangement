import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AccessKey } from '../entity/access_key';
import { ApplicationLogger } from '../common/logging/ApplicationLogger';
import { RedisService } from './redis/redis.service';
@Injectable()
export class AccessKeyService implements OnModuleInit {

 private logger = new ApplicationLogger();

  constructor(
    @InjectRepository(AccessKey)
    private accessKeyRepository: Repository<AccessKey>,
    private redisService: RedisService,

  ) {
  }

  onModuleInit() {
    this.redisService.subscribe('key_updated', 'key_deleted');
    this.redisService.on('message', (channel, message) => {
      const data = JSON.parse(message);
      this.logger.log(`channel : ${channel} , data : ${data}`)
      switch (channel) {
        case 'key_updated':
          this.handleKeyUpdated(data);
          break;
        case 'key_deleted':
          this.handleKeyDeleted(data);
          break;
      }
    });
  }

  private async handleKeyUpdated(data: any) {
    const accessKey = this.accessKeyRepository.create(data);
    await this.accessKeyRepository.save(accessKey);
  }

  private async handleKeyDeleted(data: any) {
    await this.accessKeyRepository.delete(data.id);
  }


  async getKey(key: string): Promise<AccessKey> {
    return await this.accessKeyRepository.findOne({where : {key}}  );
  }

  async incrementUsage(key: string): Promise<AccessKey> {
    const rec = await this.getKey(key);
    if (!rec) throw new NotFoundException('Key not found');
    if (!rec.isActive) throw new BadRequestException('Key disabled');
    if (Date.now() > rec.expiration.getTime())
      throw new BadRequestException('Key expired');

    rec.currentUsage += 1;
    await this.accessKeyRepository.update(rec.id, { currentUsage: rec.currentUsage });
    return rec;
  }
}