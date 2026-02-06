import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { User } from '../../users/entities/user.entity';

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
    });
  }

  async validate(payload: any) {
    // Payload contains the decoded JWT (e.g. sub: userId, email: ...).
    // We attach the full user (or partial) to the request context.
    
    const user = await this.userRepository.findOne(
      { id: payload.sub },
      { populate: ['roles', 'roles.permissions', 'tenant'] }
    );

    if (!user) {
      throw new UnauthorizedException();
    }

    // Return the user object, which will be available in req.user
    return user;
  }
}
