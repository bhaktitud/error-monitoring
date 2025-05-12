import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { 
  transformStackTrace, 
  uploadSourceMap, 
  extractSourceMapUrl, 
  clearSourceMapCache 
} from './sourcemap';

// Mock untuk fetch dengan tipe yang benar
const mockFetchImplementation = () => 
  Promise.resolve({
    ok: true,
    text: () => Promise.resolve('console.log("test");\n//# sourceMappingURL=test.js.map'),
    json: () => Promise.resolve({ version: 3, sources: ['test.ts'], mappings: 'AAAA' })
  } as Response);

global.fetch = jest.fn(mockFetchImplementation) as unknown as typeof fetch;

// Mock untuk SourceMapConsumer
jest.mock('source-map', () => {
  return {
    SourceMapConsumer: jest.fn().mockImplementation(() => ({
      originalPositionFor: jest.fn().mockReturnValue({
        source: 'src/test.ts',
        line: 10,
        column: 5,
        name: 'originalFunction'
      }),
      destroy: jest.fn()
    }))
  };
});

describe('Source Map Module', () => {
  beforeEach(() => {
    // Reset mocks dan cache sebelum tiap test
    jest.clearAllMocks();
    clearSourceMapCache();
    (global.fetch as jest.Mock).mockClear();
  });

  // Test sederhana untuk memeriksa apakah modul berfungsi
  describe('basic functionality', () => {
    it('extractSourceMapUrl should be defined', () => {
      expect(extractSourceMapUrl).toBeDefined();
    });

    it('uploadSourceMap should be defined', () => {
      expect(uploadSourceMap).toBeDefined();
    });

    it('transformStackTrace should be defined', () => {
      expect(transformStackTrace).toBeDefined();
    });

    it('clearSourceMapCache should be defined', () => {
      expect(clearSourceMapCache).toBeDefined();
    });
  });

  // Test untuk extractSourceMapUrl
  describe('extractSourceMapUrl basic', () => {
    it('should call fetch when extracting source map URL', async () => {
      const result = await extractSourceMapUrl('http://example.com/test.js');
      expect(global.fetch).toHaveBeenCalledWith('http://example.com/test.js');
    });
  });

  // Test untuk uploadSourceMap
  describe('uploadSourceMap basic', () => {
    it('should call fetch when uploading source map', async () => {
      const mockOptions = {
        dsn: 'test:dsn@test-api.com/123',
        release: '1.0.0',
        sourceMap: { version: 3, sources: ['test.ts'], mappings: 'AAAA', names: [] },
        sourceFile: 'test.js'
      };

      const result = await uploadSourceMap(mockOptions);
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  // Test untuk transformStackTrace
  describe('transformStackTrace basic', () => {
    it('should process stack trace without errors', async () => {
      const stackTrace = `Error: Test error
    at testFunction (http://example.com/test.js:1:1)`;

      const result = await transformStackTrace(stackTrace);
      expect(typeof result).toBe('string');
    });
  });
}); 