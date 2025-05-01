import { Controller, Post, Body, Headers, UseGuards, BadRequestException, UseInterceptors } from '@nestjs/common';
import { TokenInfoService } from './token-info.service';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RateLimitInterceptor } from 'src/common/interceptors/rate-limit.interceptor';

@Controller('token-info')
@UseGuards(ThrottlerGuard)
export class TokenInfoController {
  constructor(private readonly tokenInfoService: TokenInfoService) {}

  @Post()                          
  @UseGuards(RateLimitGuard) 
  @UseInterceptors(RateLimitInterceptor)     
  async getTokenInfo(
    @Headers('x-api-key') apiKey: string,    
    @Body('tokenId') tokenId: string,
  ) {
    if (!tokenId) {
      throw new BadRequestException('tokenId is required in body');
    }
    return this.tokenInfoService.getTokenInfo(tokenId);
  }
}
