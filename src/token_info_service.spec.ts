import { Test, TestingModule } from '@nestjs/testing';
import { AccessKeyService } from './providers/access-key.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccessKey } from './entity/access_key';
import { Repository, DataSource } from 'typeorm';
import { RedisService } from './providers/redis/redis.service';
import { ApplicationLogger } from './common/logging/ApplicationLogger';

describe('AccessKeyService (Microservice 2)', () => {
  let service: AccessKeyService;
  let repository: Repository<AccessKey>;
  let redisService: RedisService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockRedisService = {
    subscribe: jest.fn(),
    on: jest.fn(),
  };

  const mockDataSource = {
    getRepository: jest.fn().mockReturnValue(mockRepository),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessKeyService,
        {
          provide: getRepositoryToken(AccessKey),
          useValue: mockRepository,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        ApplicationLogger,
      ],
    }).compile();

    service = module.get<AccessKeyService>(AccessKeyService);
    repository = module.get<Repository<AccessKey>>(getRepositoryToken(AccessKey));
    redisService = module.get<RedisService>(RedisService);
  });

  describe('onModuleInit', () => {
    it('should subscribe to Redis channels and register handlers', () => {
      service.onModuleInit();

      expect(redisService.subscribe).toHaveBeenCalledWith('key_updated', 'key_deleted');
      expect(redisService.on).toHaveBeenCalledWith('message', expect.any(Function));
    });
  });

  describe('handleKeyUpdated', () => {
    it('should create and save a key', async () => {
      const mockData = {
        id: '123',
        key: 'abc',
        rateLimit: 50,
        currentUsage: 5,
        expiration: new Date(),
        isActive: true,
        isDeleted: false,
        comment: '',
        deletedBy: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockData);
      await service['handleKeyUpdated'](mockData);

      expect(mockRepository.create).toHaveBeenCalledWith(mockData);
      expect(mockRepository.save).toHaveBeenCalledWith(mockData);
    });
  });

  describe('handleKeyDeleted', () => {
    it('should delete a key by ID', async () => {
      const mockData = { id: '123' };
      await service['handleKeyDeleted'](mockData);

      expect(mockRepository.delete).toHaveBeenCalledWith('123');
    });
  });
});
