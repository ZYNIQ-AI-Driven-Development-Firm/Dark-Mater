import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface LLMConfig {
  system_prompt: string;
  tools_allowed: string[];
  runtime_hints: {
    preferred_model: string;
    num_ctx?: number;
    temperature?: number;
    num_gpu?: number;
    keep_alive?: number;
    top_k?: number;
    top_p?: number;
    repeat_penalty?: number;
  };
  version?: string;
  etag?: string;
}

export interface KnowledgeSearchParams {
  q: string;
  topK?: number;
  threshold?: number;
}

export interface KnowledgeChunk {
  id: string;
  content: string;
  source: string;
  metadata?: Record<string, any>;
  score?: number;
}

export interface KnowledgeSearchResult {
  chunks: KnowledgeChunk[];
  total: number;
  query: string;
}

export interface MemoryRetrieveParams {
  serverId: string;
  threadId: string;
  q?: string;
  limit?: number;
  before?: string;
  after?: string;
}

export interface MemoryMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface MemoryRetrieveResult {
  messages: MemoryMessage[];
  total: number;
  hasMore: boolean;
  cursor?: string;
}

export interface MemoryAppendPayload {
  serverId: string;
  threadId: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata?: Record<string, any>;
  }>;
}

export interface LLMContext {
  server_info: {
    name: string;
    version: string;
    capabilities: string[];
  };
  active_tools: string[];
  current_session?: {
    id: string;
    created_at: string;
    last_activity: string;
  };
  statistics?: {
    total_queries: number;
    avg_response_time: number;
    memory_usage: number;
  };
}

export interface DocumentMetadata {
  title: string;
  source: string;
  content_type: string;
  language?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface DocumentChunk {
  content: string;
  position: number;
  metadata?: Record<string, any>;
}

export interface DocumentMetadata {
  id: string;
  title: string;
  source: string;
  content_type: string;
  created_at?: string;
  chunk_count?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface DocumentUploadMetadata {
  title: string;
  source: string;
  content_type: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface DocumentCreateResult {
  id: string;
  status: string;
}

export interface DocumentListResult {
  docs: DocumentMetadata[];
  total: number;
  limit: number;
  offset: number;
}

export class McpServerClient {
  private client: AxiosInstance;
  private configCache: Map<string, { config: LLMConfig; timestamp: number; etag?: string }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private baseUrl: string,
    private authToken?: string,
    private timeout: number = 30000
  ) {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
      }
    });

    // Add request/response interceptors for better error handling
    this.client.interceptors.request.use(
      (config) => {
        console.debug(`[MCP Client] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[MCP Client] Request error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        console.debug(`[MCP Client] Response ${response.status} from ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('[MCP Client] Response error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Update the auth token for this client
   */
  setAuthToken(token: string | undefined) {
    this.authToken = token;
    if (token) {
      this.client.defaults.headers['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers['Authorization'];
    }
  }

  /**
   * Get LLM configuration with ETag caching
   */
  async getConfig(forceRefresh = false): Promise<LLMConfig> {
    const cacheKey = this.baseUrl;
    const cached = this.configCache.get(cacheKey);
    
    // Return cached config if valid and not forcing refresh
    if (!forceRefresh && cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.config;
    }

    try {
      const headers: Record<string, string> = {};
      if (cached?.etag) {
        headers['If-None-Match'] = cached.etag;
      }

      const response = await this.client.get('/llm/config', { headers });
      
      const config: LLMConfig = {
        ...response.data,
        etag: response.headers['etag']
      };

      // Update cache
      this.configCache.set(cacheKey, {
        config,
        timestamp: Date.now(),
        etag: response.headers['etag']
      });

      return config;
    } catch (error: any) {
      // If 304 Not Modified, use cached config
      if (error.response?.status === 304 && cached) {
        cached.timestamp = Date.now(); // Refresh cache timestamp
        return cached.config;
      }
      
      console.error('Failed to get LLM config:', error);
      
      // Return cached config as fallback if available
      if (cached) {
        console.warn('Using cached config due to API error');
        return cached.config;
      }
      
      throw new Error(`Failed to get LLM config: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Save LLM configuration with ETag support
   */
  async saveConfig(config: Partial<LLMConfig>, etag?: string): Promise<LLMConfig> {
    try {
      const headers: Record<string, string> = {};
      if (etag) {
        headers['If-Match'] = etag;
      }

      const response = await this.client.put('/llm/config', config, { headers });
      
      const updatedConfig: LLMConfig = {
        ...response.data,
        etag: response.headers['etag']
      };

      // Update cache
      this.configCache.set(this.baseUrl, {
        config: updatedConfig,
        timestamp: Date.now(),
        etag: response.headers['etag']
      });

      return updatedConfig;
    } catch (error: any) {
      console.error('Failed to save LLM config:', error);
      throw new Error(`Failed to save LLM config: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Search knowledge base
   */
  async getKnowledge(params: KnowledgeSearchParams): Promise<KnowledgeSearchResult> {
    try {
      const queryParams = {
        q: params.q,
        top_k: params.topK || 4,
        ...(params.threshold && { threshold: params.threshold })
      };

      const response = await this.client.get('/llm/knowledge/search', {
        params: queryParams
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to search knowledge:', error);
      throw new Error(`Failed to search knowledge: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Retrieve conversation memory
   */
  async getMemory(params: MemoryRetrieveParams): Promise<MemoryRetrieveResult> {
    try {
      const queryParams = {
        server_id: params.serverId,
        thread_id: params.threadId,
        limit: params.limit || 8,
        ...(params.q && { q: params.q }),
        ...(params.before && { before: params.before }),
        ...(params.after && { after: params.after })
      };

      const response = await this.client.get('/memory/retrieve', {
        params: queryParams
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to retrieve memory:', error);
      throw new Error(`Failed to retrieve memory: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Append messages to memory
   */
  async appendMemory(payload: MemoryAppendPayload): Promise<void> {
    try {
      await this.client.post('/memory/append', {
        server_id: payload.serverId,
        thread_id: payload.threadId,
        messages: payload.messages
      });
    } catch (error: any) {
      console.error('Failed to append memory:', error);
      throw new Error(`Failed to append memory: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Get server context information
   */
  async getContext(): Promise<LLMContext> {
    try {
      const response = await this.client.get('/llm/context');
      return response.data;
    } catch (error: any) {
      console.error('Failed to get context:', error);
      throw new Error(`Failed to get context: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Upload document metadata
   */
  async uploadDocumentMetadata(metadata: DocumentMetadata): Promise<{ id: string }> {
    try {
      const response = await this.client.post('/llm/knowledge/docs', metadata);
      return response.data;
    } catch (error: any) {
      console.error('Failed to upload document metadata:', error);
      throw new Error(`Failed to upload document metadata: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Upload document chunks
   */
  async uploadDocumentChunks(docId: string, chunks: DocumentChunk[]): Promise<void> {
    try {
      await this.client.post(`/llm/knowledge/docs/${docId}/chunks`, { chunks });
    } catch (error: any) {
      console.error('Failed to upload document chunks:', error);
      throw new Error(`Failed to upload document chunks: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Get document list
   */
  async getDocuments(limit = 20, offset = 0): Promise<{ docs: any[]; total: number }> {
    try {
      const response = await this.client.get('/llm/knowledge/docs', {
        params: { limit, offset }
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to get documents:', error);
      throw new Error(`Failed to get documents: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(docId: string): Promise<void> {
    try {
      await this.client.delete(`/llm/knowledge/docs/${docId}`);
    } catch (error: any) {
      console.error('Failed to delete document:', error);
      throw new Error(`Failed to delete document: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.configCache.clear();
  }

  /**
   * Test connection to MCP server
   */
  async testConnection(): Promise<{ status: string; server_info: any }> {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error: any) {
      console.error('Failed to test connection:', error);
      throw new Error(`Failed to test connection: ${error.response?.data?.detail || error.message}`);
    }
  }
}

/**
 * Factory function to create MCP server clients
 */
export function createMcpServerClient(baseUrl: string, authToken?: string): McpServerClient {
  return new McpServerClient(baseUrl, authToken);
}

/**
 * Global client registry for managing multiple MCP server connections
 */
class McpClientRegistry {
  private clients: Map<string, McpServerClient> = new Map();

  getClient(baseUrl: string, authToken?: string): McpServerClient {
    const key = `${baseUrl}:${authToken || 'no-auth'}`;
    
    if (!this.clients.has(key)) {
      this.clients.set(key, new McpServerClient(baseUrl, authToken));
    }
    
    return this.clients.get(key)!;
  }

  updateClientAuth(baseUrl: string, oldToken?: string, newToken?: string): void {
    const oldKey = `${baseUrl}:${oldToken || 'no-auth'}`;
    const newKey = `${baseUrl}:${newToken || 'no-auth'}`;
    
    const client = this.clients.get(oldKey);
    if (client) {
      client.setAuthToken(newToken);
      this.clients.delete(oldKey);
      this.clients.set(newKey, client);
    }
  }

  removeClient(baseUrl: string, authToken?: string): void {
    const key = `${baseUrl}:${authToken || 'no-auth'}`;
    this.clients.delete(key);
  }

  clearAll(): void {
    this.clients.clear();
  }
}

export const mcpClientRegistry = new McpClientRegistry();