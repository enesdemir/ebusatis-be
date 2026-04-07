import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { User } from '../../users/entities/user.entity';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'secretKey',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const user = await this.userRepository.findOne(
      { id: payload.sub },
      { populate: ['roles', 'roles.permissions', 'tenant'] }
    );

    if (!user) {
      throw new UnauthorizedException();
    }

    // tenantId kaynağı:
    // 1. User'ın kendi tenant'ı (normal kullanıcı)
    // 2. x-tenant-id header'ı (SuperAdmin tenant seçtiğinde)
    const headerTenantId = req.headers['x-tenant-id'] as string;
    (user as any).tenantId = user.tenant?.id ?? headerTenantId ?? null;

    return user;
  }
}
