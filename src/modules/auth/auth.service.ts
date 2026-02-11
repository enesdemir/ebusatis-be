import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';

/** JWT payload shape */
interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string | null;
  isSuperAdmin: boolean;
}

/** Unified login response shape */
export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    isSuperAdmin: boolean;
    isTenantOwner: boolean;
    tenantId: string | null;
    tenantName: string | null;
    isImpersonated?: boolean;
  };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Validates user credentials against database.
   */
  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.userRepository.findOne(
      { email },
      { populate: ['tenant'] },
    );
    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      return user;
    }
    return null;
  }

  /**
   * Builds JWT payload from a user entity.
   */
  private buildJwtPayload(user: User): JwtPayload {
    return {
      sub: user.id,
      email: user.email,
      tenantId: user.tenant?.id ?? null,
      isSuperAdmin: user.isSuperAdmin,
    };
  }

  /**
   * Builds the unified user response object.
   */
  private buildUserResponse(user: User, isImpersonated = false) {
    return {
      id: user.id,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      isTenantOwner: user.isTenantOwner,
      tenantId: user.tenant?.id ?? null,
      tenantName: user.tenant?.name ?? null,
      ...(isImpersonated && { isImpersonated: true }),
    };
  }

  /**
   * Generates an impersonation token for support purposes.
   */
  async impersonate(userId: string): Promise<LoginResponse> {
    const user = await this.userRepository.findOne(
      { id: userId },
      { populate: ['tenant'] },
    );
    if (!user) {
      throw new UnauthorizedException('User not found for impersonation');
    }
    const payload = this.buildJwtPayload(user);
    return {
      access_token: this.jwtService.sign(payload),
      user: this.buildUserResponse(user, true),
    };
  }

  /**
   * Authenticates user and returns JWT token with user details.
   */
  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }
    // Update last login timestamp
    user.lastLoginAt = new Date();
    await this.userRepository.getEntityManager().flush();
    const payload = this.buildJwtPayload(user);
    return {
      access_token: this.jwtService.sign(payload),
      user: this.buildUserResponse(user),
    };
  }
}
