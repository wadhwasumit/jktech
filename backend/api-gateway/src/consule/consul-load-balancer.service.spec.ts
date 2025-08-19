// --- Mock consul BEFORE loading the service under test ---
const healthServiceMock = jest.fn();
const consulCtorMock = jest.fn().mockImplementation(() => ({
  health: { service: healthServiceMock },
}));

jest.mock('consul', () => consulCtorMock);

// --- Mock ClientProxyFactory ---
import { ClientProxyFactory } from '@nestjs/microservices';
const createClientMock = jest.spyOn(ClientProxyFactory, 'create');

// Load the service AFTER mocks are set
import { ConsulLoadBalancerService } from './consule-load-balancer.service';

describe('ConsulLoadBalancerService', () => {
  let service: ConsulLoadBalancerService;
  const originalRandom = Math.random;
  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {}); // silence Nest Logger output

  beforeEach(() => {
    jest.clearAllMocks();
    // Nest Logger writes via console methods; silence error/log in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    service = new ConsulLoadBalancerService();
  });

  afterEach(() => {
    Math.random = originalRandom;
  });

  // Helper to build consul "healthy" response entries
  const entry = (host: string, port: number, statuses: Array<'passing' | 'warning' | 'critical'>) => ({
    Service: { Address: host, Port: port },
    Checks: statuses.map((s) => ({ Status: s })),
  });

  describe('getAvailableInstance', () => {
    it('returns a randomly selected healthy instance', async () => {
      // two healthy instances
      healthServiceMock.mockResolvedValue([
        entry('10.0.0.1', 4001, ['passing', 'passing']),
        entry('10.0.0.2', 4002, ['passing']),
      ]);

      // Force selection of the 2nd element (index 1)
      Math.random = () => 0.9;

      const selected = await service.getAvailableInstance('document-service');

      expect(consulCtorMock).toHaveBeenCalledWith({
        host: 'consul',
        port: 8500,
        promisify: true,
      });
      expect(healthServiceMock).toHaveBeenCalledWith('document-service');
      expect(selected).toEqual({ host: '10.0.0.2', port: 4002 });
    });

    it('throws when no healthy instances are available', async () => {
      // some failing / warning checks
      healthServiceMock.mockResolvedValue([
        entry('10.0.0.3', 5001, ['warning']),
        entry('10.0.0.4', 5002, ['critical', 'warning']),
      ]);

      await expect(service.getAvailableInstance('auth-service')).rejects.toThrow(
        'No available instance for auth-service',
      );
    });

    it('propagates consul errors with a helpful log', async () => {
      const boom = new Error('network down');
      healthServiceMock.mockRejectedValue(boom);

      await expect(service.getAvailableInstance('ingestion-service')).rejects.toThrow('network down');
    });
  });

  describe('getTcpClient', () => {
    it('creates a TCP client using the selected instance', async () => {
      // Pick a specific instance deterministically
      healthServiceMock.mockResolvedValue([entry('svc.host', 4500, ['passing'])]);
      Math.random = () => 0.01;

      const fakeClient = { send: jest.fn() } as any;
      createClientMock.mockReturnValue(fakeClient);

      const client = await service.getTcpClient('analytics-service');

      expect(healthServiceMock).toHaveBeenCalledWith('analytics-service');
      expect(ClientProxyFactory.create).toHaveBeenCalledWith({
        transport: expect.any(Number), // Transport.TCP
        options: { host: 'svc.host', port: 4500 },
      });
      expect(client).toBe(fakeClient);
    });
  });
});
