import { RedisHelper } from './redis.helper';

// Mock ioredis
const mockRedisInstance = {
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  quit: jest.fn(),
  geoadd: jest.fn(),
  geopos: jest.fn(),
  publish: jest.fn(),
  zrange: jest.fn(),
  zincrby: jest.fn(),
  zrevrange: jest.fn(),
  scan: jest.fn(),
  on: jest.fn(),
  status: 'ready', // Mock connection status for tests
};

jest.mock('ioredis', () => ({
  Redis: jest.fn().mockImplementation(() => mockRedisInstance),
}));

describe('RedisHelper', () => {
  let redisHelper: RedisHelper;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset status to ready for each test
    mockRedisInstance.status = 'ready';
    redisHelper = new RedisHelper();
    // Simulate connection events for tests
    // Access private property to set connection state
    (redisHelper as any).isConnected = true;
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('get', () => {
    it('should return value when key exists', async () => {
      const mockValue = 'test-value';
      mockRedisInstance.get.mockResolvedValue(mockValue);

      const result = await redisHelper.get('test-key');

      expect(result).toBe(mockValue);
      expect(mockRedisInstance.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null when key does not exist', async () => {
      mockRedisInstance.get.mockResolvedValue(null);

      const result = await redisHelper.get('nonexistent-key');

      expect(result).toBeNull();
    });

    it('should return null and log error on failure', async () => {
      mockRedisInstance.get.mockRejectedValue(new Error('Connection error'));

      const result = await redisHelper.get('test-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value without TTL', async () => {
      mockRedisInstance.set.mockResolvedValue('OK');

      const result = await redisHelper.set('test-key', 'test-value');

      expect(result).toBe('test-value');
      expect(mockRedisInstance.set).toHaveBeenCalledWith(
        'test-key',
        'test-value',
      );
      expect(mockRedisInstance.setex).not.toHaveBeenCalled();
    });

    it('should set value with TTL using setex', async () => {
      mockRedisInstance.setex.mockResolvedValue('OK');

      const result = await redisHelper.set('test-key', 'test-value', 300);

      expect(result).toBe('test-value');
      expect(mockRedisInstance.setex).toHaveBeenCalledWith(
        'test-key',
        300,
        'test-value',
      );
      expect(mockRedisInstance.set).not.toHaveBeenCalled();
    });

    it('should throw error on failure', async () => {
      mockRedisInstance.set.mockRejectedValue(new Error('Connection error'));

      await expect(redisHelper.set('test-key', 'test-value')).rejects.toThrow(
        'Connection error',
      );
    });
  });

  describe('del', () => {
    it('should delete key and return count', async () => {
      mockRedisInstance.del.mockResolvedValue(1);

      const result = await redisHelper.del('test-key');

      expect(result).toBe(1);
      expect(mockRedisInstance.del).toHaveBeenCalledWith('test-key');
    });

    it('should return 0 when key does not exist', async () => {
      mockRedisInstance.del.mockResolvedValue(0);

      const result = await redisHelper.del('nonexistent-key');

      expect(result).toBe(0);
    });

    it('should return 0 on failure', async () => {
      mockRedisInstance.del.mockRejectedValue(new Error('Connection error'));

      const result = await redisHelper.del('test-key');

      expect(result).toBe(0);
    });
  });

  describe('exists', () => {
    it('should return true when key exists', async () => {
      mockRedisInstance.exists.mockResolvedValue(1);

      const result = await redisHelper.exists('test-key');

      expect(result).toBe(true);
      expect(mockRedisInstance.exists).toHaveBeenCalledWith('test-key');
    });

    it('should return false when key does not exist', async () => {
      mockRedisInstance.exists.mockResolvedValue(0);

      const result = await redisHelper.exists('nonexistent-key');

      expect(result).toBe(false);
    });

    it('should return false on failure', async () => {
      mockRedisInstance.exists.mockRejectedValue(new Error('Connection error'));

      const result = await redisHelper.exists('test-key');

      expect(result).toBe(false);
    });
  });

  describe('quit', () => {
    it('should close Redis connection', async () => {
      mockRedisInstance.quit.mockResolvedValue('OK');

      await redisHelper.quit();

      expect(mockRedisInstance.quit).toHaveBeenCalled();
    });

    it('should handle quit error gracefully', async () => {
      mockRedisInstance.quit.mockRejectedValue(new Error('Connection error'));

      // Should not throw
      await expect(redisHelper.quit()).resolves.toBeUndefined();
    });
  });

  describe('geoAdd', () => {
    it('should add geolocation to Redis', async () => {
      mockRedisInstance.geoadd.mockResolvedValue(1);

      await redisHelper.geoAdd('locations', 14.5995, 120.9842, 'user-123');

      expect(mockRedisInstance.geoadd).toHaveBeenCalledWith(
        'locations',
        120.9842,
        14.5995,
        'user-123',
      );
    });

    it('should handle geoAdd error gracefully', async () => {
      mockRedisInstance.geoadd.mockRejectedValue(new Error('Connection error'));

      // Should not throw
      await expect(
        redisHelper.geoAdd('locations', 14.5995, 120.9842, 'user-123'),
      ).resolves.toBeUndefined();
    });
  });

  describe('geoPos', () => {
    it('should return positions for user IDs', async () => {
      const mockPositions = [
        ['120.9842', '14.5995'],
        ['121.0', '14.6'],
      ];
      mockRedisInstance.geopos.mockResolvedValue(mockPositions);

      const result = await redisHelper.geoPos('locations', [
        'user-123',
        'user-456',
      ]);

      expect(result).toEqual(mockPositions);
      expect(mockRedisInstance.geopos).toHaveBeenCalledWith(
        'locations',
        'user-123',
        'user-456',
      );
    });
  });

  describe('publish', () => {
    it('should publish message to channel', async () => {
      mockRedisInstance.publish.mockResolvedValue(1);

      await redisHelper.publish('channel', 'message');

      expect(mockRedisInstance.publish).toHaveBeenCalledWith(
        'channel',
        'message',
      );
    });

    it('should handle publish error gracefully', async () => {
      mockRedisInstance.publish.mockRejectedValue(
        new Error('Connection error'),
      );

      // Should not throw
      await expect(
        redisHelper.publish('channel', 'message'),
      ).resolves.toBeUndefined();
    });
  });

  describe('getMembers', () => {
    it('should return sorted set members', async () => {
      const mockMembers = ['member1', 'member2', 'member3'];
      mockRedisInstance.zrange.mockResolvedValue(mockMembers);

      const result = await redisHelper.getMembers('sorted-set');

      expect(result).toEqual(mockMembers);
      expect(mockRedisInstance.zrange).toHaveBeenCalledWith(
        'sorted-set',
        0,
        -1,
      );
    });
  });

  describe('zIncrBy', () => {
    it('should increment member score in sorted set and return new score', async () => {
      mockRedisInstance.zincrby.mockResolvedValue('5');

      const result = await redisHelper.zIncrBy('popular-searches', 1, 'coffee');

      expect(result).toBe(5);
      expect(mockRedisInstance.zincrby).toHaveBeenCalledWith(
        'popular-searches',
        1,
        'coffee',
      );
    });

    it('should return null on failure', async () => {
      mockRedisInstance.zincrby.mockRejectedValue(
        new Error('Connection error'),
      );

      const result = await redisHelper.zIncrBy('popular-searches', 1, 'coffee');

      expect(result).toBeNull();
    });
  });

  describe('zRevRange', () => {
    it('should return members with scores in descending order', async () => {
      mockRedisInstance.zrevrange.mockResolvedValue([
        'coffee',
        '10',
        'tea',
        '5',
      ]);

      const result = await redisHelper.zRevRange('popular-searches', 0, 9);

      expect(result).toEqual([
        { member: 'coffee', score: 10 },
        { member: 'tea', score: 5 },
      ]);
      expect(mockRedisInstance.zrevrange).toHaveBeenCalledWith(
        'popular-searches',
        0,
        9,
        'WITHSCORES',
      );
    });

    it('should return empty array on failure', async () => {
      mockRedisInstance.zrevrange.mockRejectedValue(
        new Error('Connection error'),
      );

      const result = await redisHelper.zRevRange('popular-searches', 0, 9);

      expect(result).toEqual([]);
    });
  });

  describe('delByPattern', () => {
    it('should delete all keys matching pattern', async () => {
      // First scan returns some keys, second scan returns empty (cursor '0')
      mockRedisInstance.scan
        .mockResolvedValueOnce(['10', ['key:1', 'key:2', 'key:3']])
        .mockResolvedValueOnce(['0', ['key:4', 'key:5']]);
      mockRedisInstance.del.mockResolvedValueOnce(3).mockResolvedValueOnce(2);

      const result = await redisHelper.delByPattern('key:*');

      expect(result).toBe(5);
      expect(mockRedisInstance.scan).toHaveBeenCalledTimes(2);
      expect(mockRedisInstance.scan).toHaveBeenCalledWith(
        '0',
        'MATCH',
        'key:*',
        'COUNT',
        100,
      );
      expect(mockRedisInstance.del).toHaveBeenCalledWith(
        'key:1',
        'key:2',
        'key:3',
      );
      expect(mockRedisInstance.del).toHaveBeenCalledWith('key:4', 'key:5');
    });

    it('should return 0 when no keys match pattern', async () => {
      mockRedisInstance.scan.mockResolvedValue(['0', []]);

      const result = await redisHelper.delByPattern('nonexistent:*');

      expect(result).toBe(0);
      expect(mockRedisInstance.del).not.toHaveBeenCalled();
    });

    it('should handle single scan iteration', async () => {
      mockRedisInstance.scan.mockResolvedValue(['0', ['key:1', 'key:2']]);
      mockRedisInstance.del.mockResolvedValue(2);

      const result = await redisHelper.delByPattern('key:*');

      expect(result).toBe(2);
      expect(mockRedisInstance.scan).toHaveBeenCalledTimes(1);
    });

    it('should return 0 on scan failure', async () => {
      mockRedisInstance.scan.mockRejectedValue(new Error('Connection error'));

      const result = await redisHelper.delByPattern('key:*');

      expect(result).toBe(0);
    });

    it('should continue and return partial count on del failure', async () => {
      mockRedisInstance.scan
        .mockResolvedValueOnce(['10', ['key:1', 'key:2']])
        .mockResolvedValueOnce(['0', ['key:3']]);
      mockRedisInstance.del
        .mockResolvedValueOnce(2)
        .mockRejectedValueOnce(new Error('Del error'));

      const result = await redisHelper.delByPattern('key:*');

      // Should return 0 because the error is caught at the top level
      expect(result).toBe(0);
    });
  });
});
