import React, { useState, useEffect } from 'react';
import type { McpServer } from '../src/types/api';

interface AIInstructionsModalProps {
  server: McpServer | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (serverId: string, instructions: AIInstructions) => void;
}

interface AIInstructions {
  systemPrompt: string;
  roleDescription: string;
  knowledgeBase: string;
  memorySettings: {
    enabled: boolean;
    maxTokens: number;
    retentionDays: number;
    compressionRatio: number;
  };
  capabilities: {
    webSearch: boolean;
    codeExecution: boolean;
    fileOperations: boolean;
    apiCalls: boolean;
  };
  personality: {
    tone: 'professional' | 'friendly' | 'technical' | 'creative';
    verbosity: 'concise' | 'balanced' | 'detailed';
    formality: 'casual' | 'neutral' | 'formal';
  };
  guidelines: string[];
  restrictions: string[];
}

export default function AIInstructionsModal({ server, isOpen, onClose, onSave }: AIInstructionsModalProps) {
  const [instructions, setInstructions] = useState<AIInstructions>({
    systemPrompt: '',
    roleDescription: '',
    knowledgeBase: '',
    memorySettings: {
      enabled: true,
      maxTokens: 4000,
      retentionDays: 30,
      compressionRatio: 0.7
    },
    capabilities: {
      webSearch: false,
      codeExecution: false,
      fileOperations: false,
      apiCalls: true
    },
    personality: {
      tone: 'professional',
      verbosity: 'balanced',
      formality: 'neutral'
    },
    guidelines: [],
    restrictions: []
  });

  const [guidelineInput, setGuidelineInput] = useState('');
  const [restrictionInput, setRestrictionInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (server && isOpen) {
      const serverInstructions = (server.credentials as any)?.aiInstructions;
      if (serverInstructions) {
        setInstructions(serverInstructions);
        setGuidelineInput(serverInstructions.guidelines?.join('\n') || '');
        setRestrictionInput(serverInstructions.restrictions?.join('\n') || '');
      } else {
        // Set defaults based on server name/type
        setInstructions(prev => ({
          ...prev,
          systemPrompt: `You are an AI assistant integrated with the ${server.name} MCP server. Provide helpful, accurate, and contextual responses.`,
          roleDescription: `Assistant for ${server.name} server operations and queries.`
        }));
      }
    }
  }, [server, isOpen]);

  const handleSave = async () => {
    if (!server) return;
    
    setIsSaving(true);
    try {
      const processedInstructions = {
        ...instructions,
        guidelines: guidelineInput.split('\n').filter(line => line.trim()),
        restrictions: restrictionInput.split('\n').filter(line => line.trim())
      };
      
      await onSave(server.id, processedInstructions);
      onClose();
    } catch (error) {
      console.error('Failed to save AI instructions:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addGuideline = () => {
    if (guidelineInput.trim()) {
      setGuidelineInput(prev => prev + '\n');
    }
  };

  const addRestriction = () => {
    if (restrictionInput.trim()) {
      setRestrictionInput(prev => prev + '\n');
    }
  };

  if (!isOpen || !server) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0a] border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 bg-gradient-to-r from-[#63bb33]/20 to-green-800/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#63bb33]/20 rounded-lg">
                <svg className="w-5 h-5 text-[#63bb33]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">AI Instructions & Role</h2>
                <p className="text-gray-400 text-sm">{server.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          {/* Core Instructions */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-white border-b border-gray-700 pb-2">Core Instructions</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">System Prompt</label>
              <textarea
                value={instructions.systemPrompt}
                onChange={(e) => setInstructions({ ...instructions, systemPrompt: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#63bb33]/50 focus:border-[#63bb33] h-24 resize-none"
                placeholder="Define the AI's core behavior and context..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Role Description</label>
              <textarea
                value={instructions.roleDescription}
                onChange={(e) => setInstructions({ ...instructions, roleDescription: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#63bb33]/50 focus:border-[#63bb33] h-20 resize-none"
                placeholder="Describe the AI's specific role and responsibilities..."
              />
            </div>
          </div>

          {/* Personality Settings */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-white border-b border-gray-700 pb-2">Personality & Style</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tone</label>
                <select
                  value={instructions.personality.tone}
                  onChange={(e) => setInstructions({
                    ...instructions,
                    personality: { ...instructions.personality, tone: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#63bb33]/50 focus:border-[#63bb33]"
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="technical">Technical</option>
                  <option value="creative">Creative</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Verbosity</label>
                <select
                  value={instructions.personality.verbosity}
                  onChange={(e) => setInstructions({
                    ...instructions,
                    personality: { ...instructions.personality, verbosity: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#63bb33]/50 focus:border-[#63bb33]"
                >
                  <option value="concise">Concise</option>
                  <option value="balanced">Balanced</option>
                  <option value="detailed">Detailed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Formality</label>
                <select
                  value={instructions.personality.formality}
                  onChange={(e) => setInstructions({
                    ...instructions,
                    personality: { ...instructions.personality, formality: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#63bb33]/50 focus:border-[#63bb33]"
                >
                  <option value="casual">Casual</option>
                  <option value="neutral">Neutral</option>
                  <option value="formal">Formal</option>
                </select>
              </div>
            </div>
          </div>

          {/* Capabilities */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-white border-b border-gray-700 pb-2">Capabilities</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(instructions.capabilities).map(([key, enabled]) => (
                <div key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    id={key}
                    checked={enabled}
                    onChange={(e) => setInstructions({
                      ...instructions,
                      capabilities: { ...instructions.capabilities, [key]: e.target.checked }
                    })}
                    className="mr-3 rounded bg-gray-800 border-gray-600 text-[#63bb33] focus:ring-[#63bb33]/50"
                  />
                  <label htmlFor={key} className="text-sm text-gray-300 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Memory Settings */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-white border-b border-gray-700 pb-2">Memory Settings</h3>
            
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="memoryEnabled"
                checked={instructions.memorySettings.enabled}
                onChange={(e) => setInstructions({
                  ...instructions,
                  memorySettings: { ...instructions.memorySettings, enabled: e.target.checked }
                })}
                className="mr-3 rounded bg-gray-800 border-gray-600 text-[#63bb33] focus:ring-[#63bb33]/50"
              />
              <label htmlFor="memoryEnabled" className="text-sm text-gray-300">
                Enable conversation memory
              </label>
            </div>

            {instructions.memorySettings.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6 border-l-2 border-[#63bb33]/30">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Tokens</label>
                  <input
                    type="number"
                    value={instructions.memorySettings.maxTokens}
                    onChange={(e) => setInstructions({
                      ...instructions,
                      memorySettings: { ...instructions.memorySettings, maxTokens: parseInt(e.target.value) || 4000 }
                    })}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#63bb33]/50 focus:border-[#63bb33]"
                    min="1000"
                    max="32000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Retention (Days)</label>
                  <input
                    type="number"
                    value={instructions.memorySettings.retentionDays}
                    onChange={(e) => setInstructions({
                      ...instructions,
                      memorySettings: { ...instructions.memorySettings, retentionDays: parseInt(e.target.value) || 30 }
                    })}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#63bb33]/50 focus:border-[#63bb33]"
                    min="1"
                    max="365"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Compression Ratio</label>
                  <input
                    type="number"
                    step="0.1"
                    value={instructions.memorySettings.compressionRatio}
                    onChange={(e) => setInstructions({
                      ...instructions,
                      memorySettings: { ...instructions.memorySettings, compressionRatio: parseFloat(e.target.value) || 0.7 }
                    })}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#63bb33]/50 focus:border-[#63bb33]"
                    min="0.1"
                    max="1.0"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Knowledge Base */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-white border-b border-gray-700 pb-2">Knowledge Base</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Custom Knowledge</label>
              <textarea
                value={instructions.knowledgeBase}
                onChange={(e) => setInstructions({ ...instructions, knowledgeBase: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#63bb33]/50 focus:border-[#63bb33] h-32 resize-none font-mono text-sm"
                placeholder="Add domain-specific knowledge, facts, or context that the AI should be aware of..."
              />
            </div>
          </div>

          {/* Guidelines & Restrictions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-md font-medium text-white border-b border-gray-700 pb-2">Guidelines</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Behavioral Guidelines</label>
                <textarea
                  value={guidelineInput}
                  onChange={(e) => setGuidelineInput(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#63bb33]/50 focus:border-[#63bb33] h-24 resize-none text-sm"
                  placeholder="Always verify information before responding&#10;Provide sources when possible&#10;Ask clarifying questions when needed"
                />
                <p className="text-gray-500 text-xs mt-1">One guideline per line</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-md font-medium text-white border-b border-gray-700 pb-2">Restrictions</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Usage Restrictions</label>
                <textarea
                  value={restrictionInput}
                  onChange={(e) => setRestrictionInput(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#63bb33]/50 focus:border-[#63bb33] h-24 resize-none text-sm"
                  placeholder="Do not access external websites&#10;Avoid personal information requests&#10;No code execution without approval"
                />
                <p className="text-gray-500 text-xs mt-1">One restriction per line</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 bg-gray-900/20 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-[#63bb33] hover:bg-[#63bb33]/80 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {isSaving ? 'Saving...' : 'Save Instructions'}
          </button>
        </div>
      </div>
    </div>
  );
}