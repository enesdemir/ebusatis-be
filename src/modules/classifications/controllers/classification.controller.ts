import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';

interface AuthenticatedRequest extends ExpressRequest {
  user?: {
    tenantId?: string;
    [key: string]: unknown;
  };
}
import { ClassificationService } from '../services/classification.service';
import {
  CreateClassificationNodeDto,
  UpdateClassificationNodeDto,
  MoveNodeDto,
  ReorderDto,
} from '../dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('classifications')
export class ClassificationController {
  constructor(private readonly service: ClassificationService) {}

  /** Tip bazinda agac getir */
  @Get('tree')
  getTree(@Query('type') type: string) {
    return this.service.getTree(type);
  }

  /** Moduldeki tiplerin ozeti */
  @Get('summary')
  getSummary(@Query('module') module?: string) {
    return this.service.getSummary(module);
  }

  /** Tek dugum */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  /** Dugumun cocuklari */
  @Get(':id/children')
  getChildren(@Param('id') id: string, @Query('recursive') recursive?: string) {
    return this.service.getChildren(id, recursive === 'true');
  }

  /** Yeni dugum olustur */
  @Post()
  create(
    @Body() dto: CreateClassificationNodeDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user?.tenantId;
    return this.service.create(dto, tenantId);
  }

  /** Dugum guncelle */
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClassificationNodeDto) {
    return this.service.update(id, dto);
  }

  /** Dugum sil (soft) */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  /** Baska parent'a tasi */
  @Post(':id/move')
  move(@Param('id') id: string, @Body() dto: MoveNodeDto) {
    return this.service.move(id, dto);
  }

  /** Aktiflestir */
  @Patch(':id/activate')
  activate(@Param('id') id: string) {
    return this.service.activate(id);
  }

  /** Pasiflestir (cascade) */
  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.service.deactivate(id);
  }

  /** Sibling siralama */
  @Post('reorder')
  reorder(@Body() dto: ReorderDto) {
    return this.service.reorder(dto);
  }
}
