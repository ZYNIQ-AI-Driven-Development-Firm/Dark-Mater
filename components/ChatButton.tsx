import React from 'react';
import { LogoIcon } from './icons/LogoIcon';

interface ChatButtonProps {
  onClick: () => void;
}

const ChatButton: React.FC<ChatButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-12 h-12 rounded-full bg-gray-900/80 border-2 border-[#63bb33]/50 flex items-center justify-center text-[#63bb33] hover:border-[#63bb33] hover:shadow-lg hover:shadow-[#63bb33]/20 transition-all duration-300"
      aria-label="Open AI Chat"
    >
      <LogoIcon className="w-6 h-6" />
    </button>
  );
};

export default ChatButton;
