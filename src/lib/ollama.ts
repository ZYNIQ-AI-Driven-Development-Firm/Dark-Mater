/**
 * Ollama API client for frontend
 */
import { api } from './api';

export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
  details?: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaStatus {
  connected: boolean;
  status: 'online' | 'offline' | 'error';
  model_count: number;
  current_model?: string;
  error?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface CompletionRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

export const ollamaApi = {
  // Get Ollama status
  getStatus: async (): Promise<OllamaStatus> => {
    try {
      const response = await api.get('/api/health/ollama');
      
      // Convert backend response to frontend format
      return {
        connected: response.ok || false,
        status: response.ok ? 'online' : 'offline',
        model_count: response.model_count || 0,
        current_model: response.current_model || (response.models && response.models.length > 0 ? response.models[0] : undefined),
        error: response.error
      };
    } catch (error: any) {
      // Handle error response
      const errorDetail = error.response?.data?.detail;
      return {
        connected: false,
        status: 'offline',
        model_count: 0,
        error: errorDetail?.error || error.message || 'Connection failed'
      };
    }
  },

  // Get available models (through health endpoint for now)
  listModels: async (): Promise<{ models: OllamaModel[] }> => {
    const status = await ollamaApi.getStatus();
    const modelNames = status.connected ? [] : []; // TODO: Get from health endpoint
    return {
      models: modelNames.map((name: string) => ({
        name,
        size: 0,
        digest: '',
        modified_at: new Date().toISOString()
      }))
    };
  },

  // Get model info (placeholder)
  getModelInfo: async (modelName: string): Promise<any> => {
    // This would need a dedicated endpoint
    throw new Error('Not implemented yet');
  },

  // Chat completion (using company chat endpoint)
  chatCompletion: async (request: ChatRequest): Promise<any> => {
    return api.post('/api/v1/chat/company', {
      message: request.messages[request.messages.length - 1]?.content || '',
      model: request.model
    });
  },

  // Text completion (using company chat endpoint)
  generateCompletion: async (request: CompletionRequest): Promise<any> => {
    return api.post('/api/v1/chat/company', {
      message: request.prompt,
      model: request.model
    });
  },

  // Pull model (placeholder)
  pullModel: async (modelName: string): Promise<{ success: boolean; model: string }> => {
    throw new Error('Model management not implemented yet');
  },

  // Delete model (placeholder)
  deleteModel: async (modelName: string): Promise<{ success: boolean; model: string }> => {
    throw new Error('Model management not implemented yet');
  },
};

export default ollamaApi;