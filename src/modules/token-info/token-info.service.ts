import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as CircuitBreaker from 'opossum';
import { RefStrings } from 'src/common/constants/reference.string';
import { Utils } from 'src/common/utils/utils';
import { ApplicationLogger } from '../../common/logging/ApplicationLogger';

@Injectable()
export class TokenInfoService {
  private circuitBreaker: CircuitBreaker;
  private logger = new ApplicationLogger();

  constructor() {
    const options = {
      timeout: 5000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
    };

    this.circuitBreaker = new CircuitBreaker(this.fetchTokenInfo.bind(this), options);
    this.circuitBreaker.fallback(() => ({ error: 'Service unavailable' }));
  }

  private async fetchTokenInfo(tokenId: string) {
    const response = await  Utils.externalRequest("CoinGecko",RefStrings.meta.requestType.get,`https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`);
    this.logger.log(`Response : ${response}`);
    return response;
  }

  async getTokenInfo(tokenId: string) {
    return this.circuitBreaker.fire(tokenId);
  }


}