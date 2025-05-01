import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AccessKeyService } from '../../providers/access-key.service';
import { ApplicationLogger } from '../logging/ApplicationLogger';
import { RedisService } from 'src/providers/redis/redis.service';


@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly windowSizeInSeconds = 60;
  private logger = new ApplicationLogger();

  constructor(
    private readonly accessKeyService: AccessKeyService,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const key = req.headers['x-api-key'];
    this.logger.log(`Processing request with API key: ${key}`);

    if (!key) {
      this.logger.error('No API key provided');
      throw new UnauthorizedException('Access key is required');
    }

    const accessKey = await this.accessKeyService.getKey(key);
    if (!accessKey || !accessKey.isActive) {
      this.logger.warn(`Invalid or inactive key: ${key}`);
      throw new UnauthorizedException('Invalid or inactive access key');
    }

    if (new Date() > accessKey.expiration) {
      this.logger.warn(`Expired key: ${key}`);
      throw new UnauthorizedException('Access key has expired');
    }

    const now = Date.now();
    const windowStart = now - this.windowSizeInSeconds * 1000;
    const redisKey = `rate_limit:${key}`;

   
    await this.redisService.zremrangebyscore(redisKey, 0, windowStart);
    const requestCount = await this.redisService.zcard(redisKey);

    this.logger.debug(`Current request count for ${key}: ${requestCount}/${accessKey.rateLimit}`);

    if (requestCount >= accessKey.threshold ) {
      this.logger.warn(`Rate limit exceeded for key: ${key} in 60 sec `);
      throw new ForbiddenException('Rate limit exceeded under window of 60 sec');
    }

    const {currentUsage} = await this.accessKeyService.getKey(
      key
    );

    if ( currentUsage >= accessKey.rateLimit) {
      this.logger.warn(`Rate limit exceeded for key: ${key}`);
      throw new ForbiddenException('Rate limit exceeded , Please Update Rate Limit !');
    }


    await this.redisService.zadd(redisKey, now, now.toString());
    await this.redisService.expire(redisKey, this.windowSizeInSeconds);
    this.logger.log(`Request allowed for key: ${key}`);



    return true;
  }
}