// Mock consul BEFORE loading the service under test.
const registerMock = jest.fn().mockResolvedValue(undefined);
const deregisterMock = jest.fn().mockResolvedValue(undefined);

jest.mock('consul', () =>
  jest.fn().mockImplementation(() => ({
    agent: { service: { register: registerMock, deregister: deregisterMock } },
  })),
);

// Mock os.hostname BEFORE loading the service too.
jest.mock('os', () => ({
  hostname: jest.fn(() => 'mock-hostname'),
}));

// Re-require the service after mocks are set.
// Using isolateModules ensures a clean module registry per test file run.
let ConsulService: any;
let ConsulCtor: any;

jest.isolateModules(() => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ConsulService = require('./consule.service').ConsulService;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ConsulCtor = require('consul');
});

describe('ConsulService', () => {
  const OLD_ENV = process.env;
  let service: InstanceType<typeof ConsulService>;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  test('constructs Consul client with env host/port when provided', () => {
    process.env.CONSUL_HOST = 'consul-host-from-env';
    process.env.CONSUL_PORT = '8600';

    service = new ConsulService();

    expect(ConsulCtor).toHaveBeenCalledWith({
      host: 'consul-host-from-env',
      port: '8600',
      promisify: true,
    });
  });

  test('constructs Consul client with fallback host "consule" and port 8500 when env not set', () => {
    delete process.env.CONSUL_HOST;
    delete process.env.CONSUL_PORT;

    service = new ConsulService();

    expect(ConsulCtor).toHaveBeenCalledWith({
      host: 'consule', // <- matches your current code
      port: 8500,
      promisify: true,
    });
  });

  test('onModuleInit registers service with correct payload and sets serviceId/hostname', async () => {
    service = new ConsulService();

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await service.onModuleInit();

    expect(registerMock).toHaveBeenCalledTimes(1);
    const arg = registerMock.mock.calls[0][0];

    expect(arg).toMatchObject({
      name: 'document-service',
      address: 'document-service',
      port: 4001,
      check: {
        http: 'http://document-service:3006/health',
        interval: '10s',
      },
    });
    expect(arg.id).toMatch(/^document-service-/);
    expect(service.serviceId).toBe(arg.id);
    expect(service.hostname).toBe('mock-hostname');

    // log is a single string; regex is robust to the random UUID suffix
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^Registered document-service-/),
    );
  });

  test('deregisterService deregisters by the registered serviceId', async () => {
    service = new ConsulService();
    await service.onModuleInit();

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await service.deregisterService();

    expect(deregisterMock).toHaveBeenCalledWith(service.serviceId);
    expect(logSpy).toHaveBeenCalledWith(
      `🛑 Deregistered service with ID: ${service.serviceId}`,
    );
  });

  test('onModuleDestroy calls deregisterService()', async () => {
    service = new ConsulService();
    await service.onModuleInit();

    const spy = jest.spyOn(service, 'deregisterService').mockResolvedValue(undefined);
    await service.onModuleDestroy();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('onApplicationShutdown calls deregisterService()', async () => {
    service = new ConsulService();
    await service.onModuleInit();

    const spy = jest.spyOn(service, 'deregisterService').mockResolvedValue(undefined);
    await service.onApplicationShutdown();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('deregisterService handles errors gracefully and logs them', async () => {
    service = new ConsulService();
    await service.onModuleInit();

    const error = new Error('boom');
    deregisterMock.mockRejectedValueOnce(error);
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await service.deregisterService();

    expect(errSpy).toHaveBeenCalledWith('❌ Error deregistering service:', error);
  });
});
