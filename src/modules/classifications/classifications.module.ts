import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ClassificationNode } from './entities/classification-node.entity';
import { ClassificationService } from './services/classification.service';
import { ClassificationController } from './controllers/classification.controller';

@Module({
  imports: [MikroOrmModule.forFeature([ClassificationNode])],
  controllers: [ClassificationController],
  providers: [ClassificationService],
  exports: [ClassificationService, MikroOrmModule],
})
export class ClassificationsModule {}
