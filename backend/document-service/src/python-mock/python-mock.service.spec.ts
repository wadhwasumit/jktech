import { PythonMockService } from './python-mock.service';

describe('PythonMockService', () => {
  let service: PythonMockService;

  const originalRandom = Math.random;

  beforeEach(() => {
    service = new PythonMockService();
    // stub delay so tests run instantly
    jest.spyOn<any, any>(service as any, 'delay').mockResolvedValue(undefined);
  });

  afterEach(() => {
    // restore random after each test
    Math.random = originalRandom;
    jest.restoreAllMocks();
  });

  describe('ingestDocuments', () => {
    it('returns success=true when random > 0.1', async () => {
      // force success path
      Math.random = () => 0.5;
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const docs = [{ id: 'a' }, { id: 'b' }];
      const result = await service.ingestDocuments(docs);

      expect(result).toEqual({ success: true });
      expect(logSpy).toHaveBeenCalledWith('Successfully ingested 2 documents');
      // delay should be awaited once
      expect((service as any).delay).toHaveBeenCalledTimes(1);
    });

    it('returns success=false with error when random <= 0.1', async () => {
      // force failure path
      Math.random = () => 0.05;

      const docs = [{ id: 'a' }];
      const result = await service.ingestDocuments(docs);

      expect(result).toEqual({
        success: false,
        error: 'Failed to process documents - simulation error',
      });
      expect((service as any).delay).toHaveBeenCalledTimes(1);
    });
  });

  describe('queryDocuments', () => {
    it('returns mock answer with top 3 relevantDocuments and deterministic confidence', async () => {
      // confidence = rand * 0.4 + 0.6
      Math.random = () => 0.5; // -> 0.8
      const query = 'What is RAG?';
      const ids = ['d1', 'd2', 'd3', 'd4', 'd5'];

      const result = await service.queryDocuments(query, ids);

      expect(result.query).toBe(query);
      expect(result.answer).toContain(`mock answer for: "${query}"`);
      expect(result.relevantDocuments).toEqual(['d1', 'd2', 'd3']); // max 3
      expect(result.confidence).toBeCloseTo(0.8, 5);
      expect((service as any).delay).toHaveBeenCalledTimes(1);
    });

    it('returns empty relevantDocuments when documentIds not provided', async () => {
      Math.random = () => 0.25; // -> confidence 0.7
      const result = await service.queryDocuments('hello');

      expect(result.relevantDocuments).toEqual([]);
      expect(result.confidence).toBeCloseTo(0.7, 5);
      expect((service as any).delay).toHaveBeenCalledTimes(1);
    });
  });
});
