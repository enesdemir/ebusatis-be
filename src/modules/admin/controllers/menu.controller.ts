import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';

interface AuthenticatedRequest extends ExpressRequest {
  user?: {
    isSuperAdmin?: boolean;
    permissions?: string[];
    [key: string]: unknown;
  };
}
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { MenuService } from '../services/menu.service';
import { MenuScope } from '../entities/menu-node.entity';

@ApiTags('Menu')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  /**
   * Returns the menu tree for the current user's context.
   * Platform admins get PLATFORM scope, tenant users get TENANT scope.
   */
  @Get('tree')
  @ApiOperation({ summary: 'Get menu tree for current user context' })
  async getTree(@Request() req: AuthenticatedRequest) {
    const isSuperAdmin = req.user?.isSuperAdmin === true;
    // For SuperAdmins, scope is determined by the x-tenant-id header only.
    // JWT may contain a tenantId from the system tenant — we ignore that.
    // For normal users, they always get TENANT scope.
    const headerTenantId = req.headers['x-tenant-id'];
    let scope: 'PLATFORM' | 'TENANT';
    if (isSuperAdmin && !headerTenantId) {
      scope = 'PLATFORM';
    } else {
      scope = 'TENANT';
    }
    const permissions = req.user?.permissions || [];
    return this.menuService.getTree(scope, permissions);
  }

  /**
   * Admin endpoint: returns all menu nodes flat for management.
   */
  @Get()
  @ApiOperation({ summary: 'List all menu nodes (flat, for admin management)' })
  async findAll() {
    return this.menuService.findAll();
  }

  /**
   * Admin endpoint: create a new menu node.
   */
  @Post()
  @ApiOperation({ summary: 'Create a new menu node' })
  async create(
    @Body()
    body: {
      code: string;
      label: string;
      icon?: string;
      path?: string;
      sortOrder?: number;
      scope?: MenuScope;
      requiredPermission?: string;
      hasDivider?: boolean;
      parentId?: string;
    },
  ) {
    return this.menuService.create(body);
  }

  /**
   * Admin endpoint: update an existing menu node.
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update a menu node' })
  async update(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      label: string;
      icon: string;
      path: string;
      sortOrder: number;
      scope: MenuScope;
      requiredPermission: string;
      hasDivider: boolean;
      isActive: boolean;
      parentId: string;
    }>,
  ) {
    return this.menuService.update(id, body);
  }

  /**
   * Admin endpoint: deactivate a menu node.
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate a menu node' })
  async remove(@Param('id') id: string) {
    return this.menuService.remove(id);
  }
}
