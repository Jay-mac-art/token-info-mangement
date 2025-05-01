import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TokenInfoController } from './token-info.controller';
import { TokenInfoService } from './token-info.service';
import { AccessKeyService } from '../../providers/access-key.service';
import { AccessKey } from '../../entity/access_key';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { RedisModule } from 'src/providers/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccessKey]),
    ThrottlerModule.forRoot([{
      ttl: 60,   
      limit: 10, 
    }]),
    RedisModule
  ],
  controllers: [TokenInfoController],
  providers: [
    TokenInfoService,
    AccessKeyService,
    RateLimitGuard,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class TokenInfoModule {}