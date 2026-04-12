import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { User } from '../../users/entities/user.entity';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepo: Record<string, jest.Mock>;
  let mockJwtService: Record<string, jest.Mock>;

  const mockTenant = { id: 'tenant-1', name: 'Test Tekstil' };

  const createMockUser = (overrides: Partial<User> = {}): Partial<User> => ({
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: '$2b$10$hashedpassword',
    isSuperAdmin: false,
    isTenantOwner: false,
    isActive: true,
    tenant: mockTenant as unknown as User['tenant'],
    lastLoginAt: undefined,
    ...overrides,
  });

  const mockFlush = jest.fn();

  beforeEach(async () => {
    mockUserRepo = {
      findOne: jest.fn(),
      getEntityManager: jest.fn().mockReturnValue({ flush: mockFlush }),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('signed-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ═══════════════════════════════════════════════════════
  //  validateUser
  // ═══════════════════════════════════════════════════════

  describe('validateUser', () => {
    it('should return the user when email and password match', async () => {
      const user = createMockUser();
      mockUserRepo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      expect(result).toBe(user);
      expect(mockUserRepo.findOne).toHaveBeenCalledWith(
        { email: 'test@example.com' },
        { populate: ['tenant'] },
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        user.passwordHash,
      );
    });

    it('should return null when user is not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      const result = await service.validateUser(
        'unknown@example.com',
        'password123',
      );

      expect(result).toBeNull();
    });

    it('should return null when password does not match', async () => {
      const user = createMockUser();
      mockUserRepo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(
        'test@example.com',
        'wrong-password',
      );

      expect(result).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════
  //  login
  // ═══════════════════════════════════════════════════════

  describe('login', () => {
    it('should return access_token and user on successful login', async () => {
      const user = createMockUser();
      mockUserRepo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.access_token).toBe('signed-jwt-token');
      expect(result.user).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        isSuperAdmin: false,
        isTenantOwner: false,
        tenantId: 'tenant-1',
        tenantName: 'Test Tekstil',
      });
    });

    it('should update lastLoginAt on successful login', async () => {
      const user = createMockUser();
      mockUserRepo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(user.lastLoginAt).toBeInstanceOf(Date);
      expect(mockFlush).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // The service returns an error code + i18n key instead of a raw
      // string; CLAUDE.md rule: every error message must be an i18n key.
      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow('errors.auth.invalid_credentials');
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const user = createMockUser({ isActive: false });
      mockUserRepo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.login({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.login({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow('errors.auth.account_deactivated');
    });

    it('should build JWT payload with correct structure', async () => {
      const user = createMockUser({ isSuperAdmin: true });
      mockUserRepo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'test@example.com',
        tenantId: 'tenant-1',
        isSuperAdmin: true,
      });
    });

    it('should set tenantId to null when user has no tenant', async () => {
      const user = createMockUser({ tenant: undefined });
      mockUserRepo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: null }),
      );
      expect(
        (
          await service.login({
            email: 'test@example.com',
            password: 'password123',
          })
        ).user.tenantId,
      ).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════
  //  impersonate
  // ═══════════════════════════════════════════════════════

  describe('impersonate', () => {
    it('should return a token with isImpersonated flag', async () => {
      const user = createMockUser();
      mockUserRepo.findOne.mockResolvedValue(user);

      const result = await service.impersonate('user-1');

      expect(result.access_token).toBe('signed-jwt-token');
      expect(result.user.isImpersonated).toBe(true);
      expect(result.user.id).toBe('user-1');
      expect(mockUserRepo.findOne).toHaveBeenCalledWith(
        { id: 'user-1' },
        { populate: ['tenant'] },
      );
    });

    it('should throw UnauthorizedException when user not found for impersonation', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.impersonate('nonexistent-user')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.impersonate('nonexistent-user')).rejects.toThrow(
        'errors.auth.user_not_found_for_impersonation',
      );
    });
  });
});
