import { ConsulService } from './consule.service';

// Mock core modules used inside the service
jest.mock('crypto', () => ({
  randomUUID: jest.fn(),
}));
jest.mock('os', () => ({
  hostname: jest.fn(),
}));

// Mock "consul" constructor and its nested API
jest.mock('consul', () => {
  const Register = jest.fn();
  const Deregister = jest.fn();
  const ctor = jest.fn().mockImplementation((opts) => ({
    agent: { service: { register: Register, deregister: Deregister } },
    __opts: opts, // keep for inspection if needed
  }));
  (ctor as any).__m = { Register, Deregister };
  return ctor;
});

const { randomUUID } = require('crypto') as { randomUUID: jest.Mock };
const os = require('os') as { hostname: jest.Mock };
const Consul = require('consul') as jest.Mock & { __m: { Register: jest.Mock; Deregister: jest.Mock } };

describe('ConsulService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Consul.mockClear();
    Consul.__m.Register.mockReset();
    Consul.__m.Deregister.mockReset();

    // default mocks
    randomUUID.mockReturnValue('uuid-123');
    os.hostname.mockReturnValue('host-1');

    // reset env per test
    delete process.env.CONSUL_HOST;
    delete process.env.CONSUL_PORT;
  });

  test('constructs Consul client with defaults when env vars are missing', () => {
    const svc = new ConsulService(); // eslint-disable-line @typescript-eslint/no-unused-vars

    expect(Consul).toHaveBeenCalledTimes(1);
    expect(Consul).toHaveBeenCalledWith({
      host: 'consul',
      port: 8500,
      promisify: true,
    });
  });

  test('constructs Consul client with env host/port when provided', () => {
    process.env.CONSUL_HOST = 'my-consul';
    process.env.CONSUL_PORT = '8600';

    const svc = new ConsulService(); // eslint-disable-line @typescript-eslint/no-unused-vars

    expect(Consul).toHaveBeenCalledTimes(1);
    expect(Consul).toHaveBeenCalledWith({
      host: 'my-consul',
      port: '8600', // string because env vars are strings
      promisify: true,
    });
  });

  test('onModuleInit registers service with expected payload and sets serviceId/hostname', async () => {
    randomUUID.mockReturnValue('abc-123');
    os.hostname.mockReturnValue('node-77');

    const svc = new ConsulService();
    await svc.onModuleInit();

    // registration payload
    expect(Consul.__m.Register).toHaveBeenCalledTimes(1);
    expect(Consul.__m.Register).toHaveBeenCalledWith({
      name: 'auth-service',
      id: 'auth-service-abc-123',
      address: 'auth-service', // as implemented in your code
      port: 3004,
      check: {
        http: 'http://auth-service:3003/health',
        interval: '10s',
      },
    });

    // fields updated
    expect(svc.serviceId).toBe('auth-service-abc-123');
    expect(svc.hostname).toBe('node-77');
  });

  test('deregisterService calls consul to deregister current serviceId', async () => {
    const svc = new ConsulService();
    // simulate serviceId assigned earlier (e.g., after register)
    (svc as any).serviceId = 'auth-service-abc-123';

    await svc.deregisterService();

    expect(Consul.__m.Deregister).toHaveBeenCalledTimes(1);
    expect(Consul.__m.Deregister).toHaveBeenCalledWith('auth-service-abc-123');
  });

  test('deregisterService swallows errors and logs them', async () => {
    const svc = new ConsulService();
    (svc as any).serviceId = 'auth-service-xyz';

    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    Consul.__m.Deregister.mockRejectedValueOnce(new Error('boom'));

    await expect(svc.deregisterService()).resolves.toBeUndefined();

    expect(errSpy).toHaveBeenCalled();
    const [msg] = errSpy.mock.calls[0];
    expect(String(msg)).toMatch(/Error deregistering service/i);

    errSpy.mockRestore();
  });

  test('onModuleDestroy calls deregisterService', async () => {
    const svc = new ConsulService();
    const spy = jest.spyOn(svc as any, 'deregisterService').mockResolvedValue(undefined);

    await svc.onModuleDestroy();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('onApplicationShutdown calls deregisterService', async () => {
    const svc = new ConsulService();
    const spy = jest.spyOn(svc as any, 'deregisterService').mockResolvedValue(undefined);

    await svc.onApplicationShutdown();

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
