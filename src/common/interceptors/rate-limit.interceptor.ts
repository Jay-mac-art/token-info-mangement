// src/common/rate-limit/rate-limit.interceptor.ts
import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
  } from '@nestjs/common';
  import { tap } from 'rxjs/operators';
  import { RedisService } from '../../providers/redis/redis.service';
  import { AccessKeyService } from '../../providers/access-key.service';
  
  @Injectable()
  export class RateLimitInterceptor implements NestInterceptor {
    constructor(
      private readonly redis: RedisService,
      private readonly keyService: AccessKeyService,
    ) {}
  
    intercept(context: ExecutionContext, next: CallHandler) {
      const req = context.switchToHttp().getRequest();
      const apiKey = req.headers['x-api-key'];
      if (!apiKey) return next.handle();
      return next.handle().pipe(
        tap(async () => {

          const keyRec = await this.keyService.incrementUsage(apiKey);
  
         
          this.redis.publish(
            'access_key_usage_update',
            JSON.stringify({
              key: apiKey,
              currentUsage: keyRec.currentUsage,
            }),
          );
        }),
      );
    }
  }
  