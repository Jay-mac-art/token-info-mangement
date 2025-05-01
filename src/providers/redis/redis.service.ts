// redis.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private publisher: Redis;
  private subscriber: Redis;

  constructor() {
    const options = {
      host: process.env.REDIS_HOST || 'localhost',
      port: +(process.env.REDIS_PORT || 6379),
    };

    this.publisher = new Redis(options);
    this.subscriber = new Redis(options);
  }

  publish(channel: string, message: string): void {
    this.publisher.publish(channel, message);
  }

  async subscribe(...channels: string[]): Promise<void> {
    await this.subscriber.subscribe(...channels);
  }

  on(event: 'message', callback: (channel: string, message: string) => void): void {
    this.subscriber.on('message', callback);
  }

  async zremrangebyscore(key: string, min: number, max: number): Promise<number> {
    return this.publisher.zremrangebyscore(key, min, max);
  }

  async zcard(key: string): Promise<number> {
    return this.publisher.zcard(key);
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    return this.publisher.zadd(key, score, member);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.publisher.expire(key, seconds);
  }

  onModuleDestroy() {
    this.publisher.disconnect();
    this.subscriber.disconnect();
  }
}
