import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from './session.service';
import { BaseSessionRepository } from '@/session/persistence/base-session.repository';
import { Session } from '@/session/domain/session';
import { User } from '@/users/domain/user';

describe('SessionService', () => {
  let sessionService: SessionService;
  let sessionRepository: BaseSessionRepository;

  const mockSessionRepository = {
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteById: jest.fn(),
    deleteByUserId: jest.fn(),
    deleteByUserIdWithExclude: jest.fn(),
  };

  const sampleUser: User = {
    id: 1,
    email: 'user@example.com',
    first_name: 'First',
    last_name: 'Last',
    email_verified: false,
    phone_verified: false,
    password: 'password',
    status: 'Active',
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };

  const sampleSession: Session = {
    id: 'session-id',
    user: sampleUser,
    hash: 'sample-token',
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: BaseSessionRepository,
          useValue: mockSessionRepository,
        },
      ],
    }).compile();

    sessionService = module.get<SessionService>(SessionService);
    sessionRepository = module.get<BaseSessionRepository>(
      BaseSessionRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should find a session by ID', async () => {
    mockSessionRepository.findById.mockResolvedValue(sampleSession);
    const result = await sessionService.findById('session-id');
    expect(result).toEqual(sampleSession);
    expect(sessionRepository.findById).toHaveBeenCalledWith('session-id');
  });

  it('should create a new session', async () => {
    const sessionData = { user: sampleUser, hash: 'sample-token' };
    mockSessionRepository.create.mockResolvedValue(sampleSession);
    const result = await sessionService.create(sessionData);
    expect(result).toEqual(sampleSession);
    expect(sessionRepository.create).toHaveBeenCalledWith(sessionData);
  });

  it('should update a session', async () => {
    const updatedSession = { ...sampleSession, token: 'new-token' };
    mockSessionRepository.update.mockResolvedValue(updatedSession);
    const result = await sessionService.update('session-id', {
      hash: 'new-token',
    });
    expect(result).toEqual(updatedSession);
    expect(sessionRepository.update).toHaveBeenCalledWith('session-id', {
      hash: 'new-token',
    });
  });

  it('should delete a session by ID', async () => {
    mockSessionRepository.deleteById.mockResolvedValue(undefined);
    await sessionService.deleteById('session-id');
    expect(sessionRepository.deleteById).toHaveBeenCalledWith('session-id');
  });

  it('should delete sessions by user ID', async () => {
    mockSessionRepository.deleteByUserId.mockResolvedValue(undefined);
    await sessionService.deleteByUserId({ user_id: 1 });
    expect(sessionRepository.deleteByUserId).toHaveBeenCalledWith({
      user_id: 1,
    });
  });

  it('should delete sessions by user ID with exclusion', async () => {
    mockSessionRepository.deleteByUserIdWithExclude.mockResolvedValue(
      undefined,
    );
    await sessionService.deleteByUserIdWithExclude({
      user_id: 1,
      excludeSessionId: 'exclude-session-id',
    });
    expect(sessionRepository.deleteByUserIdWithExclude).toHaveBeenCalledWith({
      user_id: 1,
      excludeSessionId: 'exclude-session-id',
    });
  });
});
