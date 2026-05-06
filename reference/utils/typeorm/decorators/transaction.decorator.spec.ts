import {
  Transaction,
  SerializableTransaction,
  RepeatableReadTransaction,
  ReadCommittedTransaction,
  ReadUncommittedTransaction,
  LongRunningTransaction,
  QuickTransaction,
  TRANSACTION_KEY,
  TransactionOptions,
} from './transaction.decorator';
import { IsolationLevel } from '@/utils/typeorm/enums/isolation-level.enum';
import { ReplicationModeEnum } from '@/utils/typeorm/enums/replication-mode.enum';
import { DataSource, QueryRunner } from 'typeorm';

// Mock TypeORM
jest.mock('typeorm');
jest.mock('reflect-metadata');

// Mock Reflect
const mockReflect = {
  getMetadata: jest.fn(),
  defineMetadata: jest.fn(),
  deleteMetadata: jest.fn(),
};
(global as any).Reflect = mockReflect;

describe('Transaction Decorator', () => {
  let mockDataSource: jest.Mocked<DataSource>;
  let mockQueryRunner: jest.Mocked<QueryRunner>;
  let testService: any;
  let originalMethod: jest.Mock;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock console methods
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    // Create mock QueryRunner
    mockQueryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue(undefined),
      isTransactionActive: false,
    } as any;

    // Create mock DataSource
    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    } as any;

    // Create test service
    testService = {
      _dataSource: mockDataSource,
    };

    // Create original method mock
    originalMethod = jest.fn().mockResolvedValue('test-result');

    // Reset Reflect mocks
    mockReflect.getMetadata.mockReturnValue(undefined);
    mockReflect.defineMetadata.mockImplementation();
    mockReflect.deleteMetadata.mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Basic Transaction Functionality', () => {
    it('should create and manage transaction successfully', async () => {
      const decorator = Transaction();
      const descriptor = { value: originalMethod };

      decorator(testService, 'testMethod', descriptor);

      const result = await descriptor.value.call(testService, 'arg1', 'arg2');

      expect(result).toBe('test-result');
      expect(mockDataSource.createQueryRunner).toHaveBeenCalledWith(undefined);
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalledWith(undefined);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(originalMethod).toHaveBeenCalledWith(
        'arg1',
        'arg2',
        mockQueryRunner,
      );
    });

    it('should handle transaction rollback on error', async () => {
      const error = new Error('Test error');
      originalMethod.mockRejectedValue(error);

      const decorator = Transaction();
      const descriptor = { value: originalMethod };

      decorator(testService, 'testMethod', descriptor);

      await expect(descriptor.value.call(testService)).rejects.toThrow(
        'Test error',
      );

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should handle rollback failure', async () => {
      const originalError = new Error('Original error');
      const rollbackError = new Error('Rollback error');

      originalMethod.mockRejectedValue(originalError);
      mockQueryRunner.rollbackTransaction.mockRejectedValue(rollbackError);

      const decorator = Transaction();
      const descriptor = { value: originalMethod };

      decorator(testService, 'testMethod', descriptor);

      await expect(descriptor.value.call(testService)).rejects.toThrow(
        'Rollback error',
      );
    });
  });

  describe('Configuration Options', () => {
    it('should use custom isolation level', async () => {
      const decorator = Transaction({
        isolationLevel: IsolationLevel.SERIALIZABLE,
      });
      const descriptor = { value: originalMethod };

      decorator(testService, 'testMethod', descriptor);
      await descriptor.value.call(testService);

      expect(mockQueryRunner.startTransaction).toHaveBeenCalledWith(
        IsolationLevel.SERIALIZABLE,
      );
    });

    it('should use replication mode', async () => {
      const decorator = Transaction({
        replicationMode: ReplicationModeEnum.MASTER,
      });
      const descriptor = { value: originalMethod };

      decorator(testService, 'testMethod', descriptor);
      await descriptor.value.call(testService);

      expect(mockDataSource.createQueryRunner).toHaveBeenCalledWith(
        ReplicationModeEnum.MASTER,
      );
    });

    it('should configure timeout settings', async () => {
      const options: TransactionOptions = {
        lockTimeout: 30000,
        statementTimeout: 60000,
        idle_in_transaction_session_timeout: 120000,
        idle_session_timeout: 300000,
      };

      const decorator = Transaction(options);
      const descriptor = { value: originalMethod };

      decorator(testService, 'testMethod', descriptor);
      await descriptor.value.call(testService);

      expect(mockQueryRunner.query).toHaveBeenCalledWith(
        'SET idle_session_timeout = 300000',
      );
      expect(mockQueryRunner.query).toHaveBeenCalledWith(
        'SET idle_in_transaction_session_timeout = 120000',
      );
      expect(mockQueryRunner.query).toHaveBeenCalledWith(
        'SET statement_timeout = 60000',
      );
      expect(mockQueryRunner.query).toHaveBeenCalledWith(
        'SET lock_timeout = 30000',
      );
    });

    it('should skip timeout configuration when not provided', async () => {
      const decorator = Transaction();
      const descriptor = { value: originalMethod };

      decorator(testService, 'testMethod', descriptor);
      await descriptor.value.call(testService);

      expect(mockQueryRunner.query).not.toHaveBeenCalled();
    });
  });

  describe('Logging', () => {
    it('should log transaction lifecycle when enabled', async () => {
      const decorator = Transaction({ enableLogging: true });
      const descriptor = { value: originalMethod };

      decorator(testService, 'testMethod', descriptor);
      await descriptor.value.call(testService);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Starting transaction for Object.testMethod'),
        expect.any(Object),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Transaction committed successfully for Object.testMethod',
        ),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Query runner released for Object.testMethod'),
      );
    });

    it('should log rollback when transaction fails', async () => {
      const error = new Error('Test error');
      originalMethod.mockRejectedValue(error);

      const decorator = Transaction({ enableLogging: true });
      const descriptor = { value: originalMethod };

      decorator(testService, 'testMethod', descriptor);

      await expect(descriptor.value.call(testService)).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Transaction rolled back for Object.testMethod',
        ),
        expect.objectContaining({ error: 'Test error' }),
      );
    });
  });

  describe('Graceful Fallback', () => {
    it('should execute without transaction when DataSource is missing and gracefulFallback is true', async () => {
      testService._dataSource = undefined;

      const decorator = Transaction({ gracefulFallback: true });
      const descriptor = { value: originalMethod };

      decorator(testService, 'testMethod', descriptor);
      const result = await descriptor.value.call(testService, 'arg1');

      expect(result).toBe('test-result');
      expect(originalMethod).toHaveBeenCalledWith('arg1');
      expect(mockQueryRunner.connect).not.toHaveBeenCalled();
    });

    it('should throw error when DataSource is missing and gracefulFallback is false', async () => {
      testService._dataSource = undefined;

      const decorator = Transaction({ gracefulFallback: false });
      const descriptor = { value: originalMethod };

      decorator(testService, 'testMethod', descriptor);

      await expect(descriptor.value.call(testService)).rejects.toThrow(
        'DataSource not found in Object.testMethod',
      );
    });

    it('should log warning when falling back gracefully', async () => {
      testService._dataSource = undefined;

      const decorator = Transaction({
        gracefulFallback: true,
        enableLogging: true,
      });
      const descriptor = { value: originalMethod };

      decorator(testService, 'testMethod', descriptor);
      await descriptor.value.call(testService);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'DataSource not found in Object.testMethod. Make sure it is injected in your service. Executing method without transaction.',
        ),
      );
    });
  });

  describe('Nested Transaction Support', () => {
    it('should reuse existing transaction context', async () => {
      mockReflect.getMetadata.mockReturnValue({
        ...mockQueryRunner,
        isTransactionActive: true,
      });

      const decorator = Transaction();
      const descriptor = { value: originalMethod };

      decorator(testService, 'testMethod', descriptor);
      await descriptor.value.call(testService, 'arg1');

      expect(mockDataSource.createQueryRunner).not.toHaveBeenCalled();
      expect(originalMethod).toHaveBeenCalledWith('arg1', {
        ...mockQueryRunner,
        isTransactionActive: true,
      });
    });

    it('should log when reusing existing transaction', async () => {
      mockReflect.getMetadata.mockReturnValue({
        ...mockQueryRunner,
        isTransactionActive: true,
      });

      const decorator = Transaction({ enableLogging: true });
      const descriptor = { value: originalMethod };

      decorator(testService, 'testMethod', descriptor);
      await descriptor.value.call(testService);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Reusing existing transaction context for Object.testMethod',
        ),
      );
    });

    it('should use custom metadata key', async () => {
      const customKey = Symbol('CUSTOM_KEY');

      const decorator = Transaction({ metadataKey: customKey });
      const descriptor = { value: originalMethod };

      decorator(testService, 'testMethod', descriptor);
      await descriptor.value.call(testService);

      expect(mockReflect.getMetadata).toHaveBeenCalledWith(
        customKey,
        testService,
      );
      expect(mockReflect.defineMetadata).toHaveBeenCalledWith(
        customKey,
        mockQueryRunner,
        testService,
      );
      expect(mockReflect.deleteMetadata).toHaveBeenCalledWith(
        customKey,
        testService,
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle connection failure', async () => {
      const connectionError = new Error('Connection failed');
      mockQueryRunner.connect.mockRejectedValue(connectionError);

      const decorator = Transaction();
      const descriptor = { value: originalMethod };

      decorator(testService, 'testMethod', descriptor);

      await expect(descriptor.value.call(testService)).rejects.toThrow(
        'Connection failed',
      );
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should handle transaction start failure', async () => {
      const startError = new Error('Start transaction failed');
      mockQueryRunner.startTransaction.mockRejectedValue(startError);

      const decorator = Transaction();
      const descriptor = { value: originalMethod };

      decorator(testService, 'testMethod', descriptor);

      await expect(descriptor.value.call(testService)).rejects.toThrow(
        'Start transaction failed',
      );
    });

    it('should handle commit failure', async () => {
      const commitError = new Error('Commit failed');
      mockQueryRunner.commitTransaction.mockRejectedValue(commitError);

      const decorator = Transaction();
      const descriptor = { value: originalMethod };

      decorator(testService, 'testMethod', descriptor);

      await expect(descriptor.value.call(testService)).rejects.toThrow(
        'Commit failed',
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should handle release failure', async () => {
      const releaseError = new Error('Release failed');
      mockQueryRunner.release.mockRejectedValue(releaseError);

      const decorator = Transaction();
      const descriptor = { value: originalMethod };

      decorator(testService, 'testMethod', descriptor);

      await expect(descriptor.value.call(testService)).rejects.toThrow(
        'Release failed',
      );
    });

    it('should handle release failure with logging', async () => {
      const releaseError = new Error('Release failed');
      mockQueryRunner.release.mockRejectedValue(releaseError);

      const decorator = Transaction({ enableLogging: true });
      const descriptor = { value: originalMethod };

      decorator(testService, 'testMethod', descriptor);

      await expect(descriptor.value.call(testService)).rejects.toThrow(
        'Release failed',
      );

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining(
          'Failed to release query runner for Object.testMethod',
        ),
        expect.objectContaining({ error: 'Release failed' }),
      );
    });
  });

  describe('Convenience Decorators', () => {
    describe('SerializableTransaction', () => {
      it('should use SERIALIZABLE isolation level', async () => {
        const decorator = SerializableTransaction();
        const descriptor = { value: originalMethod };

        decorator(testService, 'testMethod', descriptor);
        await descriptor.value.call(testService);

        expect(mockQueryRunner.startTransaction).toHaveBeenCalledWith(
          IsolationLevel.SERIALIZABLE,
        );
      });

      it('should accept additional options', async () => {
        const decorator = SerializableTransaction({
          enableLogging: true,
          lockTimeout: 30000,
        });
        const descriptor = { value: originalMethod };

        decorator(testService, 'testMethod', descriptor);
        await descriptor.value.call(testService);

        expect(mockQueryRunner.startTransaction).toHaveBeenCalledWith(
          IsolationLevel.SERIALIZABLE,
        );
        expect(mockQueryRunner.query).toHaveBeenCalledWith(
          'SET lock_timeout = 30000',
        );
      });
    });

    describe('RepeatableReadTransaction', () => {
      it('should use REPEATABLE_READ isolation level', async () => {
        const decorator = RepeatableReadTransaction();
        const descriptor = { value: originalMethod };

        decorator(testService, 'testMethod', descriptor);
        await descriptor.value.call(testService);

        expect(mockQueryRunner.startTransaction).toHaveBeenCalledWith(
          IsolationLevel.REPEATABLE_READ,
        );
      });
    });

    describe('ReadCommittedTransaction', () => {
      it('should use READ_COMMITTED isolation level', async () => {
        const decorator = ReadCommittedTransaction();
        const descriptor = { value: originalMethod };

        decorator(testService, 'testMethod', descriptor);
        await descriptor.value.call(testService);

        expect(mockQueryRunner.startTransaction).toHaveBeenCalledWith(
          IsolationLevel.READ_COMMITTED,
        );
      });
    });

    describe('ReadUncommittedTransaction', () => {
      it('should use READ_UNCOMMITTED isolation level', async () => {
        const decorator = ReadUncommittedTransaction();
        const descriptor = { value: originalMethod };

        decorator(testService, 'testMethod', descriptor);
        await descriptor.value.call(testService);

        expect(mockQueryRunner.startTransaction).toHaveBeenCalledWith(
          IsolationLevel.READ_UNCOMMITTED,
        );
      });
    });

    describe('LongRunningTransaction', () => {
      it('should use extended timeout values', async () => {
        const decorator = LongRunningTransaction();
        const descriptor = { value: originalMethod };

        decorator(testService, 'testMethod', descriptor);
        await descriptor.value.call(testService);

        expect(mockQueryRunner.query).toHaveBeenCalledWith(
          'SET lock_timeout = 300000',
        );
        expect(mockQueryRunner.query).toHaveBeenCalledWith(
          'SET statement_timeout = 600000',
        );
        expect(mockQueryRunner.query).toHaveBeenCalledWith(
          'SET idle_in_transaction_session_timeout = 900000',
        );
        expect(mockQueryRunner.query).toHaveBeenCalledWith(
          'SET idle_session_timeout = 1800000',
        );
      });

      it('should allow override of default options', async () => {
        const decorator = LongRunningTransaction({
          lockTimeout: 120000,
          enableLogging: true,
        });
        const descriptor = { value: originalMethod };

        decorator(testService, 'testMethod', descriptor);
        await descriptor.value.call(testService);

        expect(mockQueryRunner.query).toHaveBeenCalledWith(
          'SET lock_timeout = 120000',
        );
        expect(mockQueryRunner.query).toHaveBeenCalledWith(
          'SET statement_timeout = 600000',
        );
      });
    });

    describe('QuickTransaction', () => {
      it('should use short timeout values', async () => {
        const decorator = QuickTransaction();
        const descriptor = { value: originalMethod };

        decorator(testService, 'testMethod', descriptor);
        await descriptor.value.call(testService);

        expect(mockQueryRunner.query).toHaveBeenCalledWith(
          'SET lock_timeout = 5000',
        );
        expect(mockQueryRunner.query).toHaveBeenCalledWith(
          'SET statement_timeout = 10000',
        );
        expect(mockQueryRunner.query).toHaveBeenCalledWith(
          'SET idle_in_transaction_session_timeout = 30000',
        );
        expect(mockQueryRunner.query).toHaveBeenCalledWith(
          'SET idle_session_timeout = 60000',
        );
      });
    });
  });

  describe('Metadata Management', () => {
    it('should clean up metadata after successful transaction', async () => {
      const decorator = Transaction();
      const descriptor = { value: originalMethod };

      decorator(testService, 'testMethod', descriptor);
      await descriptor.value.call(testService);

      expect(mockReflect.defineMetadata).toHaveBeenCalledWith(
        TRANSACTION_KEY,
        mockQueryRunner,
        testService,
      );
      expect(mockReflect.deleteMetadata).toHaveBeenCalledWith(
        TRANSACTION_KEY,
        testService,
      );
    });

    it('should clean up metadata after failed transaction', async () => {
      const error = new Error('Test error');
      originalMethod.mockRejectedValue(error);

      const decorator = Transaction();
      const descriptor = { value: originalMethod };

      decorator(testService, 'testMethod', descriptor);

      await expect(descriptor.value.call(testService)).rejects.toThrow();

      expect(mockReflect.defineMetadata).toHaveBeenCalledWith(
        TRANSACTION_KEY,
        mockQueryRunner,
        testService,
      );
      expect(mockReflect.deleteMetadata).toHaveBeenCalledWith(
        TRANSACTION_KEY,
        testService,
      );
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complex transaction with all features', async () => {
      const decorator = Transaction({
        isolationLevel: IsolationLevel.SERIALIZABLE,
        replicationMode: ReplicationModeEnum.MASTER,
        lockTimeout: 30000,
        statementTimeout: 60000,
        idle_in_transaction_session_timeout: 120000,
        idle_session_timeout: 300000,
        enableLogging: true,
        gracefulFallback: false,
      });

      const descriptor = { value: originalMethod };
      decorator(testService, 'testMethod', descriptor);
      await descriptor.value.call(testService, 'arg1', 'arg2');

      expect(mockDataSource.createQueryRunner).toHaveBeenCalledWith(
        ReplicationModeEnum.MASTER,
      );
      expect(mockQueryRunner.startTransaction).toHaveBeenCalledWith(
        IsolationLevel.SERIALIZABLE,
      );
      expect(mockQueryRunner.query).toHaveBeenCalledTimes(4);
      expect(originalMethod).toHaveBeenCalledWith(
        'arg1',
        'arg2',
        mockQueryRunner,
      );
    });

    it('should handle nested transactions with different configurations', async () => {
      const parentDecorator = Transaction({
        isolationLevel: IsolationLevel.READ_COMMITTED,
        enableLogging: true,
      });
      const childDecorator = Transaction({
        isolationLevel: IsolationLevel.SERIALIZABLE,
        enableLogging: true,
      });

      const parentDescriptor = { value: originalMethod };
      const childMethod = jest.fn().mockResolvedValue('child-result');
      const childDescriptor = { value: childMethod };

      parentDecorator(testService, 'parentMethod', parentDescriptor);
      childDecorator(testService, 'childMethod', childDescriptor);

      // First call creates transaction
      await parentDescriptor.value.call(testService);

      // Mock existing transaction for child call
      mockReflect.getMetadata.mockReturnValue({
        ...mockQueryRunner,
        isTransactionActive: true,
      });

      // Second call should reuse transaction
      await childDescriptor.value.call(testService);

      expect(mockDataSource.createQueryRunner).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.startTransaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined arguments gracefully', async () => {
      const decorator = Transaction();
      const descriptor = { value: originalMethod };

      decorator(testService, 'testMethod', descriptor);
      await descriptor.value.call(testService);

      expect(originalMethod).toHaveBeenCalledWith(mockQueryRunner);
    });

    it('should handle method that returns undefined', async () => {
      originalMethod.mockResolvedValue(undefined);

      const decorator = Transaction();
      const descriptor = { value: originalMethod };

      decorator(testService, 'testMethod', descriptor);
      const result = await descriptor.value.call(testService);

      expect(result).toBeUndefined();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should handle synchronous errors', async () => {
      const error = new Error('Sync error');
      originalMethod.mockImplementation(() => {
        throw error;
      });

      const decorator = Transaction();
      const descriptor = { value: originalMethod };

      decorator(testService, 'testMethod', descriptor);

      await expect(descriptor.value.call(testService)).rejects.toThrow(
        'Sync error',
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });
});
