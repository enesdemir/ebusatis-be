import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { EntityManager } from '@mikro-orm/postgresql';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import {
  InvalidCredentialsException,
  AccountDeactivatedException,
  UserNotFoundForImpersonationException,
} from '../../common/errors/app.exceptions';
import { AuditLog, AuditAction } from '../admin/entities/audit-log.entity';

/** JWT payload shape */
interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string | null;
  isSuperAdmin: boolean;
  /** Present only on impersonation tokens. Original super-admin id. */
  impersonatedBy?: string;
  /** Original super-admin email; preserved so leaveImpersonation can reissue. */
  impersonatorEmail?: string;
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
    private readonly em: EntityManager,
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
   *
   * Token lifetime is 1 hour (shorter than the default 1-day login
   * token) so an accidentally leaked impersonation link self-expires.
   * The original super-admin id + email are embedded in the JWT so
   * `leaveImpersonation` can reissue the admin's own session token.
   *
   * Every call writes an AuditLog row (IMPERSONATE action) capturing
   * who impersonated whom from which tenant.
   */
  async impersonate(
    userId: string,
    impersonator?: { id?: string; email?: string },
  ): Promise<LoginResponse> {
    const user = await this.userRepository.findOne(
      { id: userId },
      { populate: ['tenant'] },
    );
    if (!user) {
      throw new UserNotFoundForImpersonationException(userId);
    }
    const payload: JwtPayload = {
      ...this.buildJwtPayload(user),
      impersonatedBy: impersonator?.id,
      impersonatorEmail: impersonator?.email,
    };

    if (impersonator?.id && impersonator?.email) {
      const log = new AuditLog(
        AuditAction.IMPERSONATE,
        impersonator.id,
        impersonator.email,
      );
      log.tenantId = user.tenant?.id;
      log.tenantName = user.tenant?.name;
      log.entityType = 'User';
      log.entityId = user.id;
      log.details = { impersonatedEmail: user.email };
      this.em.persist(log);
      await this.em.flush();
    }

    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '1h' }),
      user: this.buildUserResponse(user, true),
    };
  }

  /**
   * Exit an active impersonation session and reissue the original
   * super-admin's own JWT. Requires the current token to carry
   * `impersonatedBy` — otherwise nothing to leave.
   */
  async leaveImpersonation(currentPayload: JwtPayload): Promise<LoginResponse> {
    if (!currentPayload.impersonatedBy) {
      throw new UserNotFoundForImpersonationException(currentPayload.sub);
    }
    const admin = await this.userRepository.findOne(
      { id: currentPayload.impersonatedBy },
      { populate: ['tenant'] },
    );
    if (!admin) {
      throw new UserNotFoundForImpersonationException(
        currentPayload.impersonatedBy,
      );
    }
    const payload = this.buildJwtPayload(admin);
    return {
      access_token: this.jwtService.sign(payload),
      user: this.buildUserResponse(admin),
    };
  }

  /**
   * Authenticates user and returns JWT token with user details.
   */
  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new InvalidCredentialsException();
    }
    if (!user.isActive) {
      throw new AccountDeactivatedException();
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
