// Minimal client message renderer utilities
// Provides clean formatting for MCP chat pipeline components

export interface KnowledgeResult {
  source: string;
  text: string;
  score?: number;
}

export interface ContextInfo {
  server_id: string;
  services?: Array<{
    name: string;
    state: string;
  }>;
  uptime?: string;
}

/**
 * Render knowledge search results in a clean format
 * @param results Array of knowledge results
 * @returns Formatted knowledge string
 */
export function renderKnowledge(results: KnowledgeResult[]): string {
  if (!results?.length) return "Knowledge: (no hits)";
  return "Knowledge:\n" + results
    .map((r, i) => `[${i + 1}] (${r.source}) ${r.text}`)
    .join("\n---\n");
}

/**
 * Render server context information in a compact format
 * @param ctx Context information object
 * @returns Formatted context string
 */
export function renderContext(ctx: ContextInfo): string {
  return `Context: server_id=${ctx.server_id}; services=${ctx.services?.map(s => `${s.name}:${s.state}`).join(",") || "n/a"}; uptime=${ctx.uptime || "n/a"}`;
}

/**
 * Render memory messages for display
 * @param messages Array of conversation messages
 * @returns Formatted memory string
 */
export function renderMemory(messages: Array<{ role: string; content: string; timestamp?: string }>): string {
  if (!messages?.length) return "Memory: (no history)";
  
  return "Recent conversation:\n" + messages
    .slice(-3) // Show last 3 messages
    .map(m => `${m.role}: ${m.content}`)
    .join("\n");
}

/**
 * Build complete system messages array for Ollama
 * @param params Configuration and data for building system messages
 * @returns Array of Ollama messages
 */
export function buildSystemMessage(params: {
  config?: { system_prompt?: string; tools_allowed?: string[] };
  context?: any;
  knowledge?: { chunks: Array<{ source: string; content: string }> };
  guardrails?: string[];
}): Array<{ role: string; content: string }> {
  const { config, context, knowledge, guardrails } = params;
  const messages: Array<{ role: string; content: string }> = [];

  // System prompt from config
  if (config?.system_prompt) {
    messages.push({
      role: 'system',
      content: config.system_prompt
    });
  }

  // Guardrails
  if (guardrails && guardrails.length > 0) {
    messages.push({
      role: 'system',
      content: `Guardrails: You have access to these tools: ${guardrails.join(', ')}. Use them appropriately.`
    });
  }

  // Server context
  if (context) {
    messages.push({
      role: 'system',  
      content: renderContext(context)
    });
  }

  // Knowledge chunks
  if (knowledge && knowledge.chunks && knowledge.chunks.length > 0) {
    // Convert to expected format for renderKnowledge
    const knowledgeResults: KnowledgeResult[] = knowledge.chunks.map(chunk => ({
      source: chunk.source,
      text: chunk.content
    }));
    
    messages.push({
      role: 'system',
      content: renderKnowledge(knowledgeResults)
    });
  }

  return messages;
}

/**
 * Format processing metadata for display
 * @param metadata Processing timing and source information
 * @returns Formatted metadata string
 */
export function renderProcessingMetadata(
  sources?: string[],
  metadata?: {
    memory_retrieved?: number;
    knowledge_used?: number;
    processing_time?: number;
  },
  modelUsed?: string,
  tokenCount?: number
): string {
  const parts: string[] = [];
  
  // Sources count with icon
  if (sources && sources.length > 0) {
    parts.push(`<div class="flex items-center gap-1 text-xs text-gray-400">
      <span>📊</span>
      <span>${sources.length} knowledge source${sources.length !== 1 ? 's' : ''}</span>
    </div>`);
  }
  
  // Processing metadata in a single line
  if (metadata) {
    const metaParts: string[] = [];
    if (metadata.memory_retrieved && metadata.memory_retrieved > 0) {
      metaParts.push(`📝 ${metadata.memory_retrieved} memories`);
    }
    if (metadata.knowledge_used && metadata.knowledge_used > 0) {
      metaParts.push(`🧠 ${metadata.knowledge_used} facts`);
    }
    if (metadata.processing_time) {
      metaParts.push(`⏱️ ${(metadata.processing_time / 1000).toFixed(1)}s`);
    }
    
    if (metaParts.length > 0) {
      parts.push(`<div class="flex items-center gap-3 text-xs opacity-60">
        ${metaParts.map(part => `<span>${part}</span>`).join('')}
      </div>`);
    }
  }
  
  // Model information
  if (modelUsed) {
    parts.push(`<div class="text-xs opacity-60">Model: ${modelUsed}</div>`);
  }
  
  // Token count
  if (tokenCount) {
    parts.push(`<div class="text-xs opacity-60">${tokenCount} tokens</div>`);
  }
  
  return parts.join('');
}