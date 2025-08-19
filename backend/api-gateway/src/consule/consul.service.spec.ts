// --- Mocks applied BEFORE loading the service under test ---
const registerMock = jest.fn().mockResolvedValue(undefined);

const consulCtorMock = jest.fn().mockImplementation(() => ({
  agent: { service: { register: registerMock } },
}));

jest.mock('consul', () => consulCtorMock);

jest.mock('os', () => ({
  hostname: jest.fn(() => 'mock-host'),
}));

// Load the service after mocks are set
import { ConsulService } from './consule.service';

describe('ConsulService', () => {
  const OLD_ENV = process.env;
  let service: ConsulService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV }; // fresh copy
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('constructs Consul client using env host/port when provided', () => {
    process.env.CONSUL_HOST = 'consul-env';
    process.env.CONSUL_PORT = '8600';

    service = new ConsulService();

    expect(consulCtorMock).toHaveBeenCalledWith({
      host: 'consul-env',
      port: '8600', // note: your code passes env as-is (string)
      promisify: true,
    });
  });

  it('constructs Consul client with defaults when env not set', () => {
    delete process.env.CONSUL_HOST;
    delete process.env.CONSUL_PORT;

    service = new ConsulService();

    expect(consulCtorMock).toHaveBeenCalledWith({
      host: 'consul',
      port: 8500,
      promisify: true,
    });
  });

  it('onModuleInit registers service with expected payload and sets fields', async () => {
    service = new ConsulService();

    await service.onModuleInit();

    // Check register was called once with correct structure
    expect(registerMock).toHaveBeenCalledTimes(1);
    const arg = registerMock.mock.calls[0][0];

    // serviceName is "api-gateway", but ID prefix is "auth-service-"
    expect(arg).toMatchObject({
      name: 'api-gateway',
      address: 'api-gateway',
      port: 3000,
      check: {
        http: 'http://api-gateway:3000/api/docs',
        interval: '10s',
      },
    });

    // ID prefix
    expect(arg.id).toMatch(/^auth-service-/);

    // class fields updated
    expect(service.serviceId).toBe(arg.id);
    expect(service.hostname).toBe('mock-host');
  });
});
