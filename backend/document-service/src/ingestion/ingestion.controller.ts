import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { TriggerIngestionDto } from '../dtos/trigger-ingestion.dto';
import { IngestionJob } from '../entities/ingestion-job.entity';
import { MessagePattern, Payload } from '@nestjs/microservices';
@Controller('ingestion')
// @UseGuards(JwtAuthGuard, RolesGuard)
export class IngestionController {
  constructor(private readonly ingestion: IngestionService) {}

  @Post('job/trigger')
  // @Roles('ADMIN', 'EDITOR')
  async trigger(@Req() req: any, @Body() dto: TriggerIngestionDto): Promise<IngestionJob> {
    
    return this.ingestion.triggerIngestion(dto, req.user);
  }

  @Get('job/status/:jobId')
  // @Roles('ADMIN', 'EDITOR', 'VIEWER')
  async status(@Req() req: any, @Param('jobId') jobId: string): Promise<IngestionJob> {
    return this.ingestion.getJob(jobId, req.user);
  }

  @Get('jobs')
  // @Roles('ADMIN', 'EDITOR')
  async list(@Req() req: any, @Query('limit') limit = 50, @Query('offset') offset = 0): Promise<IngestionJob[]> {
    return this.ingestion.getAllJobs(req.user,Number(limit), Number(offset));
  }

  // @Post('cancel/:jobId')
  // // @Roles('ADMIN')
  // async cancel(@Param('jobId') jobId: string): Promise<{ canceled: boolean }> {
  //   return this.ingestion.cancel(jobId);
  // }

  @MessagePattern({ cmd: 'trigger_job' })
    async triggerJobTCP(@Payload() data: { dto: TriggerIngestionDto; user?: any }) {
      console.log('Triggering ingestion with DTO:', data);
      return this.ingestion.triggerIngestion(data.dto, data.user);
    }
  
  @MessagePattern({ cmd: 'get_job_status' })
  async createJobTCP(@Payload() data: { jobId: string; user: any; file?: any }) {
    // For TCP, pass a stub file (if your transport sends file metadata) or adapt service to accept nullable file
    
    return  this.ingestion.getJob(data.jobId, data.user);
  }

  @MessagePattern({ cmd: 'list_jobs' })
  async findAllJobsTCP(@Payload() data:{user:any,limit?: number, offset?: number}) {
    return this.ingestion.getAllJobs(data.user, data.limit, data.offset);
  }

  
}
