import { Injectable, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as os from 'os';
const Consul = require('consul');
@Injectable()
export class ConsulService implements OnModuleInit {
  private readonly consul: any;
  serviceName: string = 'api-gateway';
  serviceId: string;
  hostname: string;
  constructor() {
    this.consul = new Consul({
      host: process.env.CONSUL_HOST || 'consul', // ✅ Use the correct hostname
      port: process.env.CONSUL_PORT || 8500,
      promisify: true,
    });

  }

  async onModuleInit() {
    await this.registerService();
  }

  private async registerService() {
    this.serviceId = `auth-service-${randomUUID()}`; // Unique ID
    this.hostname = os.hostname(); // Unique per container
    await this.consul.agent.service.register({
      name: this.serviceName, // Common name for all replicas
      id: this.serviceId, // Unique ID per instance
      address: this.hostname, // Use dynamic hostname
      port: 3000, // Internal port
      check: {
        http: `http://${this.serviceName}:3000/api/docs`, // Health check per instance
        interval: '10s',
      },      
    });
  }
  async getPostServiceAddress(): Promise<{ host: string; port: number }> {
    try {
      const services = await this.consul.health.service({
        service: 'post-service',
        passing: true, // Only get healthy instances
      });

      if (!services.length) {
        throw new Error('No healthy post-service instances found in Consul.');
      }

      // Pick a random healthy instance (for load balancing)
      const instance = services[Math.floor(Math.random() * services.length)];

      const address = instance.Service.Address || 'localhost';
      const port = instance.Service.Port;

      console.log(`Selected Post Service instance: ${address}:${port}`);
      return { host: address, port };
    } catch (error) {
      console.error('Error fetching Post Service address from Consul:', error);
      throw new Error('Failed to fetch service address');
    }
  }

  
}