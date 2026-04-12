import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

interface AuthedRequest extends ExpressRequest {
  user?: {
    sub: string;
    email: string;
    tenantId: string | null;
    isSuperAdmin: boolean;
    impersonatedBy?: string;
    impersonatorEmail?: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: LoginDto) {
    return this.authService.login(signInDto);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('leave-impersonation')
  leaveImpersonation(@Req() req: AuthedRequest) {
    return this.authService.leaveImpersonation(
      req.user as unknown as {
        sub: string;
        email: string;
        tenantId: string | null;
        isSuperAdmin: boolean;
        impersonatedBy?: string;
        impersonatorEmail?: string;
      },
    );
  }
}
