import { useState, useEffect } from 'react';
import { ollamaApi, ChatMessage } from '../lib/api';

const initialSystemMessage: ChatMessage = {
    role: 'system',
    content: `You are "Dark Matter", an expert AI assistant for the Dark Matter MCP project. Your goal is to help users understand and interact with the project.
    - The project is a full-stack application using FastAPI for the backend and React with TypeScript for the frontend.
    - It includes a Model Context Protocol (MCP) server for managing AI agents and tools.
    - Authentication is handled via email OTP (One-Time Passcode).
    - The UI is built with Tailwind CSS.
    - Key features include enrolling and managing MCP servers (like Kali Linux agents), viewing server status, and interacting with them.
    - Be concise, helpful, and always answer in Markdown format.
    - If you don't know an answer, say "I do not have information on that topic."`
};

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Welcome to Dark Matter MCP. How can I assist you today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');

  // Fetch available models on hook initialization
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await ollamaApi.listModels();
        const modelNames = response.models.map(m => m.name);
        setAvailableModels(modelNames);
        if (modelNames.length > 0) {
          // Prefer a model with 'llama' in the name, otherwise take the first
          const preferredModel = modelNames.find(name => name.includes('llama')) || modelNames[0];
          setSelectedModel(preferredModel);
        }
      } catch (err) {
        console.error("Failed to fetch Ollama models:", err);
        setError("Could not fetch available AI models.");
      }
    };
    fetchModels();
  }, []);

  const sendMessage = async (userInput: string) => {
    if (!userInput.trim() || isLoading || !selectedModel) return;

    const newUserMessage: ChatMessage = { role: 'user', content: userInput };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await ollamaApi.chatCompletion({
        model: selectedModel,
        messages: [initialSystemMessage, ...messages, newUserMessage],
      });
      
      // Assuming the response has a 'message' property with the content
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message?.content || "Sorry, I received an empty response.",
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (err: any) {
      console.error("Chat API error:", err);
      const errorMessage = err.response?.data?.error || "An error occurred while communicating with the AI.";
      setError(errorMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    availableModels,
    selectedModel,
    setSelectedModel,
  };
};