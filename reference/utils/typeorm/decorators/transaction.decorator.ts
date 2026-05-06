import { IsolationLevel } from '@/utils/typeorm/enums/isolation-level.enum';
import { ReplicationModeEnum } from '@/utils/typeorm/enums/replication-mode.enum';
import { DataSource, QueryRunner } from 'typeorm';

/**
 * Symbol used as the default metadata key for storing transaction context
 * @constant {symbol}
 */
export const TRANSACTION_KEY = Symbol('TRANSACTION');

/**
 * Configuration options for the Transaction decorator
 * @interface TransactionOptions
 */
export interface TransactionOptions {
  /**
   * The isolation level to set for the transaction
   * @type {IsolationLevel}
   * @optional
   * @example IsolationLevel.SERIALIZABLE
   */
  isolationLevel?: IsolationLevel;

  /**
   * Whether to enable logging for transaction lifecycle events
   * @type {boolean}
   * @default false
   * @optional
   */
  enableLogging?: boolean;

  /**
   * Custom metadata key for storing transaction context (useful for nested transactions)
   * @type {symbol}
   * @default TRANSACTION_KEY
   * @optional
   */
  metadataKey?: symbol;

  /**
   * Whether to execute the method without transaction if DataSource is not found
   * @type {boolean}
   * @default true
   * @optional
   */
  gracefulFallback?: boolean;

  /**
   * Replication mode for the query runner (master/slave)
   * @type {ReplicationModeEnum}
   * @optional
   */
  replicationMode?: ReplicationModeEnum;

  /**
   * Lock timeout in milliseconds for the transaction
   * @type {number}
   * @optional
   */
  lockTimeout?: number;

  /**
   * Statement timeout in milliseconds for the transaction
   * @type {number}
   * @optional
   */
  statementTimeout?: number;

  /**
   * Idle in transaction session timeout in milliseconds
   * @type {number}
   * @optional
   */
  idle_in_transaction_session_timeout?: number;

  /**
   * Idle session timeout in milliseconds
   * @type {number}
   * @optional
   */
  idle_session_timeout?: number;
}

/**
 * A TypeScript decorator that wraps methods in database transactions with advanced features
 *
 * Features:
 * - Automatic transaction management (start, commit, rollback, release)
 * - Custom isolation levels support
 * - Nested transaction detection and reuse
 * - Comprehensive logging
 * - Graceful fallback when DataSource is unavailable
 * - Custom metadata key support
 * - Error handling with proper cleanup
 * - Replication mode configuration
 * - Timeout configuration (lock, statement, idle session)
 *
 * @param {TransactionOptions} options - Configuration options for the transaction
 * @returns {MethodDecorator} The method decorator function
 *
 * @example
 * ```typescript
 * // Basic usage
 * @Transaction()
 * async createUser(userData: CreateUserDto, queryRunner?: QueryRunner) {
 *   return await this.userRepository.save(userData);
 * }
 *
 * // With custom isolation level and logging
 * @Transaction({
 *   isolationLevel: IsolationLevel.SERIALIZABLE,
 *   enableLogging: true
 * })
 * async criticalOperation(data: any, queryRunner?: QueryRunner) {
 *   // Critical business logic here
 * }
 *
 * // With replication mode and timeouts
 * @Transaction({
 *   replicationMode: ReplicationModeEnum.MASTER,
 *   lockTimeout: 30000,
 *   statementTimeout: 60000,
 *   idle_in_transaction_session_timeout: 120000,
 *   idle_session_timeout: 300000,
 *   enableLogging: true
 * })
 * async complexOperation(data: any, queryRunner?: QueryRunner) {
 *   // Complex operation with specific timeout requirements
 * }
 *
 * // Nested transaction example
 * @Transaction({ enableLogging: true })
 * async createUserWithProfile(userData: CreateUserDto, queryRunner?: QueryRunner) {
 *   const user = await this.createUser(userData, queryRunner);
 *   await this.createProfile(user.id, queryRunner);
 *   return user;
 * }
 * ```
 *
 * @throws {Error} When gracefulFallback is false and DataSource is not found
 * @throws {Error} When transaction operations fail and cannot be recovered
 *
 * @since 1.0.0
 */
export function Transaction(options: TransactionOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const {
      isolationLevel,
      enableLogging = false,
      metadataKey = TRANSACTION_KEY,
      gracefulFallback = true,
      replicationMode,
      lockTimeout,
      statementTimeout,
      idle_in_transaction_session_timeout,
      idle_session_timeout,
    } = options;

    descriptor.value = async function (...args: any[]) {
      const dataSource: DataSource = this._dataSource;
      const methodName = `${target.constructor.name}.${propertyKey}`;

      // Handle missing DataSource
      if (!dataSource) {
        const errorMessage = `DataSource not found in ${methodName}. Make sure it is injected in your service.`;

        if (!gracefulFallback) throw new Error(errorMessage);

        if (enableLogging) {
          console.warn(errorMessage + ' Executing method without transaction.');
        }

        return await originalMethod.apply(this, args);
      }

      // Check for existing transaction context (nested transaction support)
      const existingQueryRunner = Reflect.getMetadata(metadataKey, this);

      if (existingQueryRunner && existingQueryRunner.isTransactionActive) {
        if (enableLogging) {
          console.log(`Reusing existing transaction context for ${methodName}`);
        }

        return await originalMethod.apply(this, [...args, existingQueryRunner]);
      }

      // Create new transaction
      const queryRunner: QueryRunner =
        dataSource.createQueryRunner(replicationMode);
      let transactionStarted = false;

      try {
        await queryRunner.connect();

        // Configure session timeouts before starting transaction
        if (idle_session_timeout) {
          await queryRunner.query(
            `SET idle_session_timeout = ${idle_session_timeout}`,
          );
        }

        if (idle_in_transaction_session_timeout) {
          await queryRunner.query(
            `SET idle_in_transaction_session_timeout = ${idle_in_transaction_session_timeout}`,
          );
        }

        // Configure statement timeout
        if (statementTimeout) {
          await queryRunner.query(
            `SET statement_timeout = ${statementTimeout}`,
          );
        }

        // Configure lock timeout
        if (lockTimeout) {
          await queryRunner.query(`SET lock_timeout = ${lockTimeout}`);
        }

        if (enableLogging) {
          console.log(`Starting transaction for ${methodName}`, {
            isolationLevel,
            replicationMode,
            lockTimeout,
            statementTimeout,
            idle_in_transaction_session_timeout,
            idle_session_timeout,
          });
        }

        await queryRunner.startTransaction(isolationLevel);
        transactionStarted = true;

        // Store transaction context for nested transactions
        Reflect.defineMetadata(metadataKey, queryRunner, this);

        // Execute the original method with queryRunner
        const result = await originalMethod.apply(this, [...args, queryRunner]);

        // Commit transaction on success
        await queryRunner.commitTransaction();

        if (enableLogging) {
          console.log(`Transaction committed successfully for ${methodName}`);
        }

        return result;
      } catch (error) {
        // Only attempt rollback if transaction was started
        if (!transactionStarted) throw error;

        try {
          await queryRunner.rollbackTransaction();
          if (enableLogging) {
            console.log(`Transaction rolled back for ${methodName}`, {
              error: error.message,
            });
          }
        } catch (rollbackError) {
          if (enableLogging) {
            console.error(`Failed to rollback transaction for ${methodName}`, {
              originalError: error.message,
              rollbackError: rollbackError.message,
            });
          }

          throw rollbackError;
        }

        throw error;
      } finally {
        // Clean up transaction context
        Reflect.deleteMetadata(metadataKey, this);

        // Release query runner resources
        try {
          await queryRunner.release();
          if (enableLogging) {
            console.log(`Query runner released for ${methodName}`);
          }
        } catch (releaseError) {
          if (enableLogging) {
            console.error(`Failed to release query runner for ${methodName}`, {
              error: releaseError.message,
            });
          }

          throw releaseError;
        }
      }
    };

    return descriptor;
  };
}

/**
 * Convenience decorator for SERIALIZABLE isolation level transactions
 *
 * This is the highest isolation level that provides complete isolation from other transactions.
 * It prevents dirty reads, non-repeatable reads, and phantom reads.
 *
 * @param {Omit<TransactionOptions, 'isolationLevel'>} options - Transaction options excluding isolationLevel
 * @returns {MethodDecorator} The method decorator function
 *
 * @example
 * ```typescript
 * @SerializableTransaction({
 *   enableLogging: true,
 *   lockTimeout: 30000,
 *   statementTimeout: 60000
 * })
 * async criticalFinancialOperation(data: any, queryRunner?: QueryRunner) {
 *   // High-consistency operation
 * }
 * ```
 *
 * @since 1.0.0
 */
export const SerializableTransaction = (
  options: Omit<TransactionOptions, 'isolationLevel'> = {},
) => Transaction({ ...options, isolationLevel: IsolationLevel.SERIALIZABLE });

/**
 * Convenience decorator for REPEATABLE READ isolation level transactions
 *
 * This isolation level prevents dirty reads and non-repeatable reads, but allows phantom reads.
 * A transaction will see the same data for repeated reads during its execution.
 *
 * @param {Omit<TransactionOptions, 'isolationLevel'>} options - Transaction options excluding isolationLevel
 * @returns {MethodDecorator} The method decorator function
 *
 * @example
 * ```typescript
 * @RepeatableReadTransaction({
 *   enableLogging: true,
 *   replicationMode: ReplicationModeEnum.SLAVE
 * })
 * async generateReport(filters: any, queryRunner?: QueryRunner) {
 *   // Report generation with consistent data
 * }
 * ```
 *
 * @since 1.0.0
 */
export const RepeatableReadTransaction = (
  options: Omit<TransactionOptions, 'isolationLevel'> = {},
) =>
  Transaction({ ...options, isolationLevel: IsolationLevel.REPEATABLE_READ });

/**
 * Convenience decorator for READ UNCOMMITTED isolation level transactions
 *
 * This is the lowest isolation level that allows dirty reads, non-repeatable reads, and phantom reads.
 * Should be used with caution as it can read uncommitted changes from other transactions.
 *
 * @param {Omit<TransactionOptions, 'isolationLevel'>} options - Transaction options excluding isolationLevel
 * @returns {MethodDecorator} The method decorator function
 *
 * @example
 * ```typescript
 * @ReadUncommittedTransaction({
 *   enableLogging: true,
 *   idle_session_timeout: 300000
 * })
 * async quickAnalytics(queryRunner?: QueryRunner) {
 *   // Fast analytics where slight inconsistency is acceptable
 * }
 * ```
 *
 * @since 1.0.0
 */
export const ReadUncommittedTransaction = (
  options: Omit<TransactionOptions, 'isolationLevel'> = {},
) =>
  Transaction({ ...options, isolationLevel: IsolationLevel.READ_UNCOMMITTED });

/**
 * Convenience decorator for READ COMMITTED isolation level transactions
 *
 * This isolation level prevents dirty reads but allows non-repeatable reads and phantom reads.
 * This is the default isolation level for most database systems.
 *
 * @param {Omit<TransactionOptions, 'isolationLevel'>} options - Transaction options excluding isolationLevel
 * @returns {MethodDecorator} The method decorator function
 *
 * @example
 * ```typescript
 * @ReadCommittedTransaction({
 *   enableLogging: true,
 *   lockTimeout: 15000,
 *   statementTimeout: 30000
 * })
 * async standardOperation(data: any, queryRunner?: QueryRunner) {
 *   // Standard business operation
 * }
 * ```
 *
 * @since 1.0.0
 */
export const ReadCommittedTransaction = (
  options: Omit<TransactionOptions, 'isolationLevel'> = {},
) => Transaction({ ...options, isolationLevel: IsolationLevel.READ_COMMITTED });

/**
 * Convenience decorator for long-running transactions with extended timeouts
 *
 * Pre-configured with extended timeout values suitable for long-running operations.
 *
 * @param {TransactionOptions} options - Transaction options
 * @returns {MethodDecorator} The method decorator function
 *
 * @example
 * ```typescript
 * @LongRunningTransaction({
 *   enableLogging: true,
 *   replicationMode: ReplicationModeEnum.MASTER
 * })
 * async dataMigration(data: any, queryRunner?: QueryRunner) {
 *   // Long-running data migration
 * }
 * ```
 *
 * @since 1.0.0
 */
export const LongRunningTransaction = (options: TransactionOptions = {}) =>
  Transaction({
    lockTimeout: 300000, // 5 minutes
    statementTimeout: 600000, // 10 minutes
    idle_in_transaction_session_timeout: 900000, // 15 minutes
    idle_session_timeout: 1800000, // 30 minutes
    ...options,
  });

/**
 * Convenience decorator for quick operations with short timeouts
 *
 * Pre-configured with short timeout values suitable for quick operations.
 *
 * @param {TransactionOptions} options - Transaction options
 * @returns {MethodDecorator} The method decorator function
 *
 * @example
 * ```typescript
 * @QuickTransaction({
 *   enableLogging: true,
 *   isolationLevel: IsolationLevel.READ_COMMITTED
 * })
 * async quickInsert(data: any, queryRunner?: QueryRunner) {
 *   // Quick insert operation
 * }
 * ```
 *
 * @since 1.0.0
 */
export const QuickTransaction = (options: TransactionOptions = {}) =>
  Transaction({
    lockTimeout: 5000, // 5 seconds
    statementTimeout: 10000, // 10 seconds
    idle_in_transaction_session_timeout: 30000, // 30 seconds
    idle_session_timeout: 60000, // 1 minute
    ...options,
  });
