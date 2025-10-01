import React, { useState } from 'react';
import { MenuIcon } from './icons/MenuIcon';
import { PlusIcon } from './icons/PlusIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { ProfileIcon } from './icons/ProfileIcon';
import { ServerIcon } from './icons/ServerIcon';
import AddClientModal from './AddClientModal';
import ProfileModal from './ProfileModal';
import ServerWindow from './ServerWindow';

interface MainPageProps {
  onLogout: () => void;
}

// Define Server type
interface Server {
  id: number;
  name: string;
  status: 'online' | 'offline';
}

const MainPage: React.FC<MainPageProps> = ({ onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeServer, setActiveServer] = useState<Server | null>(null);

  // Mock data for connected servers
  const [connectedServers] = useState<Server[]>([
    { id: 1, name: 'KALI-MCP-PROD', status: 'online' }
  ]);

  const handleServerClick = (server: Server) => {
    setActiveServer(server);
  };

  const handleCloseServerWindow = () => {
    setActiveServer(null);
  };

  return (
    <div className="flex h-screen bg-black text-gray-300">
      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-10">
        <div className="relative w-96">
            <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-[#63bb33]/50"></div>
            <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-[#63bb33]/50"></div>
            <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-[#63bb33]/50"></div>
            <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-[#63bb33]/50"></div>
            <img 
              src="https://raw.githubusercontent.com/khalilpreview/M7yapp9sColl3c1oncdn/refs/heads/main/dark_mater_white_inline_logo.png" 
              alt="Dark Matter Logo" 
              className="w-full h-auto p-4 mx-auto logo-fade-pulse" 
            />
        </div>
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 left-6 z-50">
         <div className="relative flex flex-col items-center gap-3">
            {isMenuOpen && (
              <>
                <div className="group relative flex items-center">
                  <button 
                    onClick={() => setIsProfileModalOpen(true)}
                    className="w-12 h-12 rounded-full bg-gray-900/80 border-2 border-[#63bb33]/50 flex items-center justify-center text-[#63bb33] hover:border-[#63bb33] hover:shadow-lg hover:shadow-[#63bb33]/20 transition-all duration-300"
                    aria-label="Profile Settings"
                  >
                    <ProfileIcon className="w-6 h-6" />
                  </button>
                  <span className="pointer-events-none absolute left-full ml-4 whitespace-nowrap rounded-sm bg-gray-900/90 px-3 py-1 text-sm text-[#63bb33] opacity-0 transition-opacity group-hover:opacity-100">
                    [PROFILE]
                  </span>
                </div>
                <div className="group relative flex items-center">
                  <button 
                    onClick={onLogout}
                    className="w-12 h-12 rounded-full bg-gray-900/80 border-2 border-[#63bb33]/50 flex items-center justify-center text-[#63bb33] hover:border-[#63bb33] hover:shadow-lg hover:shadow-[#63bb33]/20 transition-all duration-300"
                    aria-label="Logout"
                  >
                    <LogoutIcon className="w-6 h-6" />
                  </button>
                  <span className="pointer-events-none absolute left-full ml-4 whitespace-nowrap rounded-sm bg-gray-900/90 px-3 py-1 text-sm text-[#63bb33] opacity-0 transition-opacity group-hover:opacity-100">
                    [LOGOUT]
                  </span>
                </div>
              </>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-14 h-14 rounded-full bg-gray-900/80 border-2 border-[#63bb33]/50 flex items-center justify-center text-[#63bb33] hover:border-[#63bb33] hover:shadow-lg hover:shadow-[#63bb33]/20 transition-all duration-300"
              aria-label="Toggle menu"
            >
              <MenuIcon className="w-7 h-7" />
            </button>
         </div>
      </div>
      
      <div className="fixed bottom-6 right-6 z-40">
        <div className="relative flex flex-col items-center gap-3">
          {connectedServers.map(server => (
            <div key={server.id} className="group relative flex items-center">
               <button 
                  onClick={() => handleServerClick(server)}
                  className="w-12 h-12 rounded-full bg-gray-900/80 border-2 border-[#63bb33]/50 flex items-center justify-center text-[#63bb33] hover:border-[#63bb33] hover:shadow-lg hover:shadow-[#63bb33]/20 transition-all duration-300 relative"
                  aria-label={`Server: ${server.name}`}
                >
                  <ServerIcon className="w-6 h-6" />
                  {server.status === 'online' && (
                    <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-[#63bb33] border-2 border-gray-900"></span>
                  )}
                </button>
                <span className="pointer-events-none absolute right-full mr-4 whitespace-nowrap rounded-sm bg-gray-900/90 px-3 py-1 text-sm text-[#63bb33] opacity-0 transition-opacity group-hover:opacity-100">
                  [{server.name}]
                </span>
            </div>
          ))}
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-14 h-14 rounded-full bg-gray-900/80 border-2 border-[#63bb33]/50 flex items-center justify-center text-[#63bb33] hover:border-[#63bb33] hover:shadow-lg hover:shadow-[#63bb33]/20 transition-all duration-300"
            aria-label="Connect to new MCP Server"
          >
            <PlusIcon className="w-7 h-7" />
          </button>
        </div>
      </div>
      
      <AddClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
      <ServerWindow server={activeServer} isOpen={!!activeServer} onClose={handleCloseServerWindow} />
    </div>
  );
};

export default MainPage;