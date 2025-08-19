import { Test, TestingModule } from '@nestjs/testing';
import { TcpClientService } from './tcp-client.service';
import { ConsulLoadBalancerService } from './consule/consule-load-balancer.service';
import { of, lastValueFrom, throwError } from 'rxjs';

describe('TcpClientService', () => {
  let service: TcpClientService;

  const loadBalancerMock = {
    getTcpClient: jest.fn(),
  };

  // simple fake ClientProxy
  const makeClient = (result$: any) => ({
    send: jest.fn().mockReturnValue(result$),
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TcpClientService,
        { provide: ConsulLoadBalancerService, useValue: loadBalancerMock },
      ],
    }).compile();

    service = module.get<TcpClientService>(TcpClientService);
  });

  it('sendAuthReq: gets client for "auth-service" and forwards pattern/data', async () => {
    const pattern = { cmd: 'login' };
    const payload = { email: 'a@b.com', password: 'x' };
    const result = { token: 'jwt' };

    const client = makeClient(of(result));
    loadBalancerMock.getTcpClient.mockResolvedValue(client);

    const out = await lastValueFrom(await service.sendAuthReq(pattern, payload));

    expect(loadBalancerMock.getTcpClient).toHaveBeenCalledWith('auth-service');
    expect(client.send).toHaveBeenCalledWith(pattern, payload);
    expect(out).toEqual(result);
  });

  it('sendDocumentReq: gets client for "document-service" and forwards pattern/data', async () => {
    const pattern = { cmd: 'get_document_by_id' };
    const payload = { id: 'doc-1' };
    const result = { id: 'doc-1', title: 'Spec' };

    const client = makeClient(of(result));
    loadBalancerMock.getTcpClient.mockResolvedValue(client);

    const out = await lastValueFrom(await service.sendDocumentReq(pattern, payload));

    expect(loadBalancerMock.getTcpClient).toHaveBeenCalledWith('document-service');
    expect(client.send).toHaveBeenCalledWith(pattern, payload);
    expect(out).toEqual(result);
  });

  it('propagates error if load balancer fails to provide client', async () => {
    loadBalancerMock.getTcpClient.mockRejectedValue(new Error('No healthy instances'));

    // assert on the Promise rejection from sendAuthReq
    await expect(
        service.sendAuthReq({ cmd: 'x' }, {})
    ).rejects.toThrow('No healthy instances');
});

  it('propagates error if client.send() errors', async () => {
    const client = makeClient(throwError(() => new Error('transport error')));
    loadBalancerMock.getTcpClient.mockResolvedValue(client);

    await expect(
      lastValueFrom(await service.sendDocumentReq({ cmd: 'x' }, {})),
    ).rejects.toThrow('transport error');
  });
});
