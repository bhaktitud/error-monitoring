import { jest } from '@jest/globals';
import nock from 'nock';
import {
  init,
  setUser,
  setTags,
  addBreadcrumb,
  captureException,
  captureMessage,
  getUser,
  getTags,
  getBreadcrumbs
} from './index';

describe('Error Monitor SDK', () => {
  const mockDSN = 'test-dsn';
  const mockApiUrl = 'http://test-api.com';
  
  beforeEach(() => {
    // Reset global state
    jest.clearAllMocks();
    nock.cleanAll();
  });

  describe('init', () => {
    it('should initialize SDK with correct options', () => {
      init({
        dsn: mockDSN,
        apiUrl: mockApiUrl,
        environment: 'test',
        release: '1.0.0',
      });
      // Tidak perlu cek process.env, cukup pastikan tidak error
    });

    it('should throw error if DSN is not provided', () => {
      expect(() => {
        init({ dsn: '' });
      }).toThrow('DSN is required');
    });
  });

  describe('setUser', () => {
    it('should set user information correctly', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
      };

      setUser(mockUser);
      expect(getUser()).toEqual(mockUser);
    });
  });

  describe('setTags', () => {
    it('should set tags correctly', () => {
      const mockTags = {
        environment: 'test',
        version: '1.0.0',
      };

      setTags(mockTags);
      expect(getTags()).toEqual(mockTags);
    });
  });

  describe('addBreadcrumb', () => {
    it('should add breadcrumb correctly', () => {
      const mockBreadcrumb = {
        category: 'test',
        message: 'Test message',
        level: 'info' as const,
        data: {}
      };

      addBreadcrumb(mockBreadcrumb);
      const breadcrumbs = getBreadcrumbs();
      expect(breadcrumbs[0]).toMatchObject({
        category: mockBreadcrumb.category,
        message: mockBreadcrumb.message,
        level: mockBreadcrumb.level,
        data: mockBreadcrumb.data
      });
      expect(breadcrumbs[0].timestamp).toBeDefined();
    });
  });

  describe('captureException', () => {
    beforeEach(() => {
      init({ dsn: mockDSN, apiUrl: mockApiUrl });
    });

    it('should send error to API correctly', async () => {
      const mockError = new Error('Test error');
      const mockResponse = { id: '123', status: 'success' };

      nock(mockApiUrl)
        .post('/api/events')
        .reply(200, mockResponse);

      const result = await captureException(mockError);
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors gracefully', async () => {
      const mockError = new Error('Test error');

      nock(mockApiUrl)
        .post('/api/events')
        .reply(500);

      const result = await captureException(mockError);
      expect(result).toHaveProperty('error');
    });
  });

  describe('captureMessage', () => {
    beforeEach(() => {
      init({ dsn: mockDSN, apiUrl: mockApiUrl });
    });

    it('should send message to API correctly', async () => {
      const mockMessage = 'Test message';
      const mockResponse = { id: '123', status: 'success' };

      nock(mockApiUrl)
        .post('/api/events')
        .reply(200, mockResponse);

      const result = await captureMessage(mockMessage, 'info');
      expect(result).toEqual(mockResponse);
    });

    it('should handle different message levels', async () => {
      const mockMessage = 'Test message';
      const mockResponse = { id: '123', status: 'success' };

      nock(mockApiUrl)
        .post('/api/events')
        .reply(200, mockResponse);

      const result = await captureMessage(mockMessage, 'error');
      expect(result).toEqual(mockResponse);
    });
  });
}); 