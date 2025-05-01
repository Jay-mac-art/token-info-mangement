import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostgresModule } from './config/database/postgres.module';
import { RedisModule } from './providers/redis/redis.module';
import { TokenInfoModule } from './modules/token-info/token-info.module';
import { ConfigurationModule } from './config/config.module';

@Module({
  imports: [
    PostgresModule,
    TokenInfoModule,
    RedisModule,
    ConfigurationModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
