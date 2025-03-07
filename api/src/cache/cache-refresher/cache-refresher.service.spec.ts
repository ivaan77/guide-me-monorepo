import { Test, TestingModule } from '@nestjs/testing';
import { CacheRefresherService } from './cache-refresher.service';

describe('CacheRefresherService', () => {
  let service: CacheRefresherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CacheRefresherService],
    }).compile();

    service = module.get<CacheRefresherService>(CacheRefresherService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
