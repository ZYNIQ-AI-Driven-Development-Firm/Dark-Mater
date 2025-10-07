// Mock test suite for mcpServerClient
// This would require vitest or jest to be installed: npm install -D vitest @vitest/ui

import axios from 'axios';
import { McpServerClient, createMcpServerClient, mcpClientRegistry } from '../clients/mcpServerClient';

// Mock axios for testing
const mockAxios = {
  create: jest.fn(),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
};

// Example test structure (commented out as testing framework not installed)
/*

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('McpServerClient', () => {
  let client: McpServerClient;
  const baseUrl = 'http://localhost:8080';
  const authToken = 'test-token';

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock axios.create to return a mock instance
    const mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    };
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    
    client = new McpServerClient(baseUrl, authToken);
  });

  afterEach(() => {
    client.clearCache();
  });

  describe('constructor', () => {
    it('should create client with correct base URL and auth token', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: baseUrl,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
    });

    it('should create client without auth token', () => {
      vi.clearAllMocks();
      new McpServerClient(baseUrl);
      
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: baseUrl,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    });
  });

  describe('getConfig', () => {
    const mockConfig = {
      system_prompt: 'Test system prompt',
      tools_allowed: ['web_search', 'code_execution'],
      runtime_hints: {
        preferred_model: 'phi3:mini',
        temperature: 0.7,
        num_ctx: 4096,
        keep_alive: 0
      }
    };

    it('should fetch and cache config successfully', async () => {
      const mockResponse = { data: mockConfig, headers: { etag: 'test-etag' } };
      (client as any).client.get.mockResolvedValue(mockResponse);

      const result = await client.getConfig();

      expect((client as any).client.get).toHaveBeenCalledWith('/llm/config');
      expect(result).toEqual(mockConfig);
    });

    it('should use cached config when available and fresh', async () => {
      const mockResponse = { data: mockConfig, headers: { etag: 'test-etag' } };
      (client as any).client.get.mockResolvedValue(mockResponse);

      // First call - should fetch
      await client.getConfig();
      
      // Second call - should use cache
      const result = await client.getConfig();

      expect((client as any).client.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockConfig);
    });

    it('should handle 304 Not Modified response', async () => {
      const mockResponse = { data: mockConfig, headers: { etag: 'test-etag' } };
      (client as any).client.get.mockResolvedValueOnce(mockResponse);
      
      // First call to populate cache
      await client.getConfig();
      
      // Mock 304 response
      const notModifiedError = { 
        response: { status: 304, data: null },
        message: 'Request failed with status code 304'
      };
      (client as any).client.get.mockRejectedValueOnce(notModifiedError);

      const result = await client.getConfig();

      expect(result).toEqual(mockConfig);
    });

    it('should throw error on failed request', async () => {
      const mockError = new Error('Network error');
      (client as any).client.get.mockRejectedValue(mockError);

      await expect(client.getConfig()).rejects.toThrow('Failed to get LLM config: Network error');
    });
  });

  describe('getKnowledge', () => {
    const mockKnowledgeResult = {
      chunks: [
        {
          id: 'chunk1',
          content: 'Test knowledge content',
          source: 'test.md',
          score: 0.95
        }
      ],
      total: 1,
      query: 'test query'
    };

    it('should search knowledge successfully', async () => {
      const mockResponse = { data: mockKnowledgeResult };
      (client as any).client.get.mockResolvedValue(mockResponse);

      const result = await client.getKnowledge({ q: 'test query', topK: 5 });

      expect((client as any).client.get).toHaveBeenCalledWith('/knowledge/search', {
        params: { q: 'test query', topK: 5 }
      });
      expect(result).toEqual(mockKnowledgeResult);
    });

    it('should handle empty knowledge results', async () => {
      const emptyResult = { chunks: [], total: 0, query: 'no results' };
      const mockResponse = { data: emptyResult };
      (client as any).client.get.mockResolvedValue(mockResponse);

      const result = await client.getKnowledge({ q: 'no results' });

      expect(result).toEqual(emptyResult);
    });

    it('should throw error on failed knowledge search', async () => {
      const mockError = new Error('Search failed');
      (client as any).client.get.mockRejectedValue(mockError);

      await expect(client.getKnowledge({ q: 'test' })).rejects.toThrow('Failed to search knowledge: Search failed');
    });
  });

  describe('getMemory', () => {
    const mockMemoryResult = {
      messages: [
        {
          id: 'msg1',
          role: 'user' as const,
          content: 'Test message',
          timestamp: '2024-01-01T00:00:00Z'
        }
      ],
      total: 1,
      hasMore: false
    };

    it('should retrieve memory successfully', async () => {
      const mockResponse = { data: mockMemoryResult };
      (client as any).client.get.mockResolvedValue(mockResponse);

      const params = {
        serverId: 'test-server',
        threadId: 'test-thread',
        q: 'search query',
        limit: 10
      };

      const result = await client.getMemory(params);

      expect((client as any).client.get).toHaveBeenCalledWith('/memory/retrieve', {
        params: params
      });
      expect(result).toEqual(mockMemoryResult);
    });

    it('should throw error on failed memory retrieval', async () => {
      const mockError = new Error('Memory retrieval failed');
      (client as any).client.get.mockRejectedValue(mockError);

      await expect(client.getMemory({
        serverId: 'test',
        threadId: 'test'
      })).rejects.toThrow('Failed to retrieve memory: Memory retrieval failed');
    });
  });

  describe('appendMemory', () => {
    const mockPayload = {
      serverId: 'test-server',
      threadId: 'test-thread',
      message: {
        role: 'user' as const,
        content: 'Test message'
      }
    };

    it('should append memory successfully', async () => {
      const mockResponse = { data: { success: true } };
      (client as any).client.post.mockResolvedValue(mockResponse);

      await client.appendMemory(mockPayload);

      expect((client as any).client.post).toHaveBeenCalledWith('/memory/append', mockPayload);
    });

    it('should throw error on failed memory append', async () => {
      const mockError = new Error('Append failed');
      (client as any).client.post.mockRejectedValue(mockError);

      await expect(client.appendMemory(mockPayload)).rejects.toThrow('Failed to append memory: Append failed');
    });
  });

  describe('getContext', () => {
    const mockContextResult = {
      context: 'Test context information',
      metadata: { 
        timestamp: '2024-01-01T00:00:00Z',
        source: 'test'
      }
    };

    it('should get context successfully', async () => {
      const mockResponse = { data: mockContextResult };
      (client as any).client.get.mockResolvedValue(mockResponse);

      const result = await client.getContext();

      expect((client as any).client.get).toHaveBeenCalledWith('/context');
      expect(result).toEqual(mockContextResult);
    });

    it('should throw error on failed context retrieval', async () => {
      const mockError = new Error('Context failed');
      (client as any).client.get.mockRejectedValue(mockError);

      await expect(client.getContext()).rejects.toThrow('Failed to get context: Context failed');
    });
  });

  describe('knowledge management methods', () => {
    describe('getDocuments', () => {
      const mockDocuments = {
        docs: [{ id: 'doc1', title: 'Test Doc', source: 'test.md' }],
        total: 1,
        limit: 50,
        offset: 0
      };

      it('should get documents successfully', async () => {
        const mockResponse = { data: mockDocuments };
        (client as any).client.get.mockResolvedValue(mockResponse);

        const result = await client.getDocuments(50, 0);

        expect((client as any).client.get).toHaveBeenCalledWith('/knowledge/documents', {
          params: { limit: 50, offset: 0 }
        });
        expect(result).toEqual(mockDocuments);
      });
    });

    describe('uploadDocumentMetadata', () => {
      const mockMetadata = {
        title: 'Test Document',
        source: 'test.md',
        content_type: 'text/markdown',
        tags: ['test'],
        metadata: { author: 'test' }
      };

      it('should upload document metadata successfully', async () => {
        const mockResponse = { data: { id: 'doc123', status: 'created' } };
        (client as any).client.post.mockResolvedValue(mockResponse);

        const result = await client.uploadDocumentMetadata(mockMetadata);

        expect((client as any).client.post).toHaveBeenCalledWith('/knowledge/documents', mockMetadata);
        expect(result).toEqual({ id: 'doc123', status: 'created' });
      });
    });

    describe('uploadDocumentChunks', () => {
      const mockChunks = [
        {
          content: 'Test content',
          position: 0,
          metadata: { size: 12 }
        }
      ];

      it('should upload document chunks successfully', async () => {
        const mockResponse = { data: { success: true } };
        (client as any).client.post.mockResolvedValue(mockResponse);

        await client.uploadDocumentChunks('doc123', mockChunks);

        expect((client as any).client.post).toHaveBeenCalledWith('/knowledge/documents/doc123/chunks', {
          chunks: mockChunks
        });
      });
    });

    describe('deleteDocument', () => {
      it('should delete document successfully', async () => {
        const mockResponse = { data: { success: true } };
        (client as any).client.delete.mockResolvedValue(mockResponse);

        await client.deleteDocument('doc123');

        expect((client as any).client.delete).toHaveBeenCalledWith('/knowledge/documents/doc123');
      });
    });
  });

  describe('authentication', () => {
    it('should update auth token', () => {
      const newToken = 'new-token';
      client.setAuthToken(newToken);

      // Verify the token was updated by checking if a new client would be created with the new token
      expect((client as any).authToken).toBe(newToken);
    });

    it('should clear auth token', () => {
      client.setAuthToken(undefined);
      expect((client as any).authToken).toBeUndefined();
    });
  });

  describe('cache management', () => {
    it('should clear cache successfully', () => {
      client.clearCache();
      // Cache is private, but we can test that subsequent calls don't use cache
      expect(() => client.clearCache()).not.toThrow();
    });
  });

  describe('connection testing', () => {
    const mockHealthResponse = {
      status: 'healthy',
      server_info: { version: '1.0.0' }
    };

    it('should test connection successfully', async () => {
      const mockResponse = { data: mockHealthResponse };
      (client as any).client.get.mockResolvedValue(mockResponse);

      const result = await client.testConnection();

      expect((client as any).client.get).toHaveBeenCalledWith('/health');
      expect(result).toEqual(mockHealthResponse);
    });

    it('should handle connection test failure', async () => {
      const mockError = new Error('Connection failed');
      (client as any).client.get.mockRejectedValue(mockError);

      await expect(client.testConnection()).rejects.toThrow('Failed to test connection: Connection failed');
    });
  });
});

describe('createMcpServerClient factory', () => {
  it('should create a new client instance', () => {
    const client = createMcpServerClient('http://localhost:8080', 'token');
    expect(client).toBeInstanceOf(McpServerClient);
  });
});

describe('mcpClientRegistry', () => {
  beforeEach(() => {
    mcpClientRegistry.clearAll();
  });

  afterEach(() => {
    mcpClientRegistry.clearAll();
  });

  it('should create and cache client instances', () => {
    const baseUrl = 'http://localhost:8080';
    const token = 'test-token';

    const client1 = mcpClientRegistry.getClient(baseUrl, token);
    const client2 = mcpClientRegistry.getClient(baseUrl, token);

    expect(client1).toBe(client2); // Same instance should be returned
    expect(client1).toBeInstanceOf(McpServerClient);
  });

  it('should create different instances for different URLs or tokens', () => {
    const client1 = mcpClientRegistry.getClient('http://localhost:8080', 'token1');
    const client2 = mcpClientRegistry.getClient('http://localhost:8081', 'token1');
    const client3 = mcpClientRegistry.getClient('http://localhost:8080', 'token2');

    expect(client1).not.toBe(client2);
    expect(client1).not.toBe(client3);
    expect(client2).not.toBe(client3);
  });

  it('should update client auth token', () => {
    const baseUrl = 'http://localhost:8080';
    const oldToken = 'old-token';
    const newToken = 'new-token';

    const client1 = mcpClientRegistry.getClient(baseUrl, oldToken);
    mcpClientRegistry.updateClientAuth(baseUrl, oldToken, newToken);
    const client2 = mcpClientRegistry.getClient(baseUrl, newToken);

    expect(client1).toBe(client2); // Should be the same updated instance
  });

  it('should remove client from registry', () => {
    const baseUrl = 'http://localhost:8080';
    const token = 'test-token';

    const client1 = mcpClientRegistry.getClient(baseUrl, token);
    mcpClientRegistry.removeClient(baseUrl, token);
    const client2 = mcpClientRegistry.getClient(baseUrl, token);

    expect(client1).not.toBe(client2); // Should be a new instance
  });

  it('should clear all clients', () => {
    mcpClientRegistry.getClient('http://localhost:8080', 'token1');
    mcpClientRegistry.getClient('http://localhost:8081', 'token2');

    mcpClientRegistry.clearAll();

    const client1 = mcpClientRegistry.getClient('http://localhost:8080', 'token1');
    const client2 = mcpClientRegistry.getClient('http://localhost:8081', 'token2');

    // Should be new instances after clearing
    expect(client1).toBeInstanceOf(McpServerClient);
    expect(client2).toBeInstanceOf(McpServerClient);
  });
});
*/

// Manual test functions that can be run in browser console or Node.js

export class McpServerClientTestSuite {
  private client: McpServerClient;
  private baseUrl = 'http://localhost:8080';
  private authToken = 'test-token';

  constructor() {
    this.client = new McpServerClient(this.baseUrl, this.authToken);
  }

  async testBasicFunctionality() {
    console.log('🧪 Starting MCP Server Client Tests...');
    const results = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Test 1: Client creation
    try {
      results.total++;
      const client = createMcpServerClient(this.baseUrl, this.authToken);
      if (client instanceof McpServerClient) {
        console.log('✅ Client creation test passed');
        results.passed++;
      } else {
        throw new Error('Client is not instance of McpServerClient');
      }
    } catch (error) {
      console.log('❌ Client creation test failed:', error);
      results.failed++;
      results.errors.push(`Client creation: ${error}`);
    }

    // Test 2: Registry functionality
    try {
      results.total++;
      const client1 = mcpClientRegistry.getClient(this.baseUrl, this.authToken);
      const client2 = mcpClientRegistry.getClient(this.baseUrl, this.authToken);
      
      if (client1 === client2) {
        console.log('✅ Registry caching test passed');
        results.passed++;
      } else {
        throw new Error('Registry should return same instance for same URL/token');
      }
    } catch (error) {
      console.log('❌ Registry caching test failed:', error);
      results.failed++;
      results.errors.push(`Registry caching: ${error}`);
    }

    // Test 3: Auth token update
    try {
      results.total++;
      this.client.setAuthToken('new-token');
      // If no error thrown, test passes
      console.log('✅ Auth token update test passed');
      results.passed++;
    } catch (error) {
      console.log('❌ Auth token update test failed:', error);
      results.failed++;
      results.errors.push(`Auth token update: ${error}`);
    }

    // Test 4: Cache clearing
    try {
      results.total++;
      this.client.clearCache();
      // If no error thrown, test passes
      console.log('✅ Cache clearing test passed');
      results.passed++;
    } catch (error) {
      console.log('❌ Cache clearing test failed:', error);
      results.failed++;
      results.errors.push(`Cache clearing: ${error}`);
    }

    console.log('\n📊 Test Results:');
    console.log(`Total: ${results.total}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach(error => console.log(`  - ${error}`));
    }

    return results;
  }

  async testErrorHandling() {
    console.log('\n🧪 Testing Error Handling...');
    
    // Test invalid URL handling
    try {
      const invalidClient = new McpServerClient('invalid-url');
      console.log('⚠️  Invalid URL accepted (expected behavior for client creation)');
    } catch (error) {
      console.log('❌ Unexpected error with invalid URL:', error);
    }

    console.log('✅ Error handling tests completed');
  }

  async runAllTests() {
    const basicResults = await this.testBasicFunctionality();
    await this.testErrorHandling();
    
    return basicResults;
  }
}

// Export test runner for use in browser console
export const runMcpClientTests = () => {
  const testSuite = new McpServerClientTestSuite();
  return testSuite.runAllTests();
};