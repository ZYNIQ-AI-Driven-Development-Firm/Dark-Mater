import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../src/hooks/useChat';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { CloseIcon } from './icons/CloseIcon';
import { LogoIcon } from './icons/LogoIcon';

interface ChatWidgetProps {
  onClose: () => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ onClose }) => {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    availableModels,
    selectedModel,
    setSelectedModel,
  } = useChat();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90vw] max-w-lg h-[70vh] max-h-[600px] bg-gray-900/80 backdrop-blur-md border border-[#63bb33]/30 rounded-lg shadow-2xl shadow-black/50 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <LogoIcon className="w-6 h-6 text-[#63bb33]" />
          <h3 className="font-bold text-md text-gray-200">Dark Matter AI</h3>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-[#63bb33]">
          <CloseIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Model Selector */}
      {availableModels.length > 0 && (
        <div className="p-2 border-b border-gray-700">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full bg-gray-800 text-xs text-gray-300 rounded-md p-1 focus:outline-none focus:ring-1 focus:ring-[#63bb33]"
          >
            {availableModels.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
        {isLoading && (
          <ChatMessage message={{ role: 'assistant', content: '...' }} />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-2 text-xs text-center text-red-400 bg-red-900/30 border-t border-gray-700">
          {error}
        </div>
      )}

      {/* Input */}
      <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
    </div>
  );
};

export default ChatWidget;