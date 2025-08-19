import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  async healthCheck() {
    const healthReport = {
      database: await this.checkDatabase(),
      uptime: process.uptime(),
      timestamp: new Date(),
    };

    return healthReport;
  }

  private async checkDatabase(): Promise<string> {
    try {
      if (!this.dataSource.isInitialized) {
        await this.dataSource.initialize();
      }
      await this.dataSource.query('SELECT 1');
      return "UP";
    } catch (error) {
      return 'DOWN';
    }
  }

}
