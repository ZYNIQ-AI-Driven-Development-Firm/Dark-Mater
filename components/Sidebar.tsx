import React from 'react';
import { LogoIcon } from './icons/LogoIcon';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      ></div>
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-700 z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-start h-16 px-4 border-b border-gray-700">
            <LogoIcon className="h-8 w-8 text-green-400" />
            <span className="ml-3 text-lg font-semibold text-gray-200">MCP Client</span>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            {/* Nav items removed */}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;