import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConsulLoadBalancerService } from './consule/consule-load-balancer.service';

@Injectable()
export class TcpClientService {

  constructor( private readonly loadBalancer: ConsulLoadBalancerService) {}

  
  async sendAuthReq(pattern: object, data: any) {

    const client = await this.loadBalancer.getTcpClient('auth-service');
    return client.send(pattern, data);
  }

   async sendDocumentReq(pattern: object, data: any) {

    const client = await this.loadBalancer.getTcpClient('document-service');
    return client.send(pattern, data);
  }

}
