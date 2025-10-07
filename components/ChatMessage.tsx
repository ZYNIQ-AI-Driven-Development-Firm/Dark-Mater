import React from 'react';
import { ChatMessage as Message } from '../src/lib/ollama';
import ReactMarkdown from 'react-markdown';
import { LogoIcon } from './icons/LogoIcon';
import { ProfileIcon } from './icons/ProfileIcon';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gray-700 flex items-center justify-center">
          <LogoIcon className="w-5 h-5 text-[#63bb33]" />
        </div>
      )}
      <div
        className={`max-w-sm md:max-w-md lg:max-w-lg px-4 py-3 rounded-xl ${
          isUser
            ? 'bg-[#63bb33] text-black'
            : 'bg-gray-800 text-gray-200'
        }`}
      >
        <div className="prose prose-sm prose-invert prose-p:before:content-[''] prose-p:after:content-['']">
            <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      </div>
      {isUser && (
        <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gray-700 flex items-center justify-center">
          <ProfileIcon className="w-5 h-5 text-gray-400" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;