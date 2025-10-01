import React, { useState, useEffect } from 'react';
import BackgroundGrid from './BackgroundGrid';
import Footer from './Footer';

const bootCommand = "boot --verbose";

interface LandingPageProps {
  onEnter: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const [typedCommand, setTypedCommand] = useState('');
  const [showOutput, setShowOutput] = useState(false);
  const [showCta, setShowCta] = useState(false);
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    // Start typing the command
    let charIndex = 0;
    const typingInterval = setInterval(() => {
      setTypedCommand(prev => prev + bootCommand[charIndex]);
      charIndex++;
      if (charIndex === bootCommand.length) {
        clearInterval(typingInterval);
        setIsTyping(false);
        // After typing, show the output
        setTimeout(() => setShowOutput(true), 500);
        // After showing the output, show the CTA button
        setTimeout(() => setShowCta(true), 1500);
      }
    }, 80);

    return () => clearInterval(typingInterval);
  }, []);
  
  const handleScrollDown = (targetId: string) => {
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
  };


  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col bg-black">
      <BackgroundGrid />
      <div className="relative z-10 flex flex-col flex-grow min-h-screen">
        
        {/* Hero Section */}
        <section id="hero" className="min-h-screen flex flex-col items-center justify-center text-center p-6">
          <div className="relative w-80 mb-8">
            <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-[#63bb33]/50"></div>
            <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-[#63bb33]/50"></div>
            <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-[#63bb33]/50"></div>
            <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-[#63bb33]/50"></div>
            <img 
              src="https://raw.githubusercontent.com/khalilpreview/M7yapp9sColl3c1oncdn/refs/heads/main/dark_mater_white_inline_logo.png" 
              alt="Dark Matter Logo" 
              className="w-full h-auto logo-fade-pulse" 
            />
          </div>

          <div className="w-full max-w-3xl mx-auto">
            {/* Command Input */}
            <div className="text-xl md:text-2xl text-left mb-6 font-semibold">
              <span className="text-gray-400">&gt; </span>
              <span className="text-white">{typedCommand}</span>
              {isTyping && <span className="blinking-cursor h-6 w-px"></span>}
            </div>
            
            {/* Command Output */}
            <div className={`text-left space-y-6 transition-opacity duration-1000 ${showOutput ? 'opacity-100' : 'opacity-0'}`}>
               <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                Not just another AI chat. Our MCP agent remembers, learns, and grows with you turning conversations into long-term collaboration.
              </p>
              <p className="text-[#63bb33] text-sm md:text-base font-semibold tracking-wider">
                MCP + persistent, scoped memory + security-oriented workflows wrapped in a clean dashboard
              </p>
              <p className="text-xs md:text-sm tracking-wider font-semibold break-words">
                <span className="text-purple-400">[LLM / AI Agent]</span>
                <span className="text-[#63bb33]"> &lt;---&gt; </span>
                <span className="text-purple-400">[MCP Client]</span>
                <span className="text-[#63bb33]"> &lt;---&gt; </span>
                <span className="text-purple-400">[MCP Server]</span>
                <span className="text-[#63bb33]"> &lt;---&gt; </span>
                <span className="text-purple-400">[Tools/APIs/Data]</span>
              </p>
            </div>

            {/* Call to Action */}
            <div className={`mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 transition-opacity duration-1000 ${showCta ? 'opacity-100' : 'opacity-0'}`}>
              <button
                onClick={onEnter}
                className="group text-xl md:text-2xl hover:text-white transition-colors duration-300"
              >
                <span className="text-gray-400 group-hover:text-white">&gt; </span>
                <span>[ INITIATE CONNECTION ]</span>
              </button>
              
              <span className="text-gray-600 text-sm hidden sm:inline-block">// OR</span>

              <button
                onClick={() => handleScrollDown('modules')}
                className="text-sm md:text-base text-gray-500 hover:text-[#63bb33] transition-colors duration-300"
              >
                [ INSTALL A SERVER ]
              </button>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section id="modules" className="min-h-screen flex flex-col justify-between py-16 px-6">
            <div className="flex-grow flex flex-col items-center justify-center">
              <h2 className="text-xl text-center mb-10">[ AVAILABLE_MODULES ]</h2>
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                
                {/* Product 1 */}
                <div className="relative">
                  <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-[#63bb33]/50"></div>
                  <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-[#63bb33]/50"></div>
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-[#63bb33]/50"></div>
                  <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-[#63bb33]/50"></div>
                  <div className="bg-gray-900/50 border border-[#63bb33]/30 p-8 h-full">
                    <h3 className="text-lg text-[#63bb33] mb-3">// MODULE_01: SERVER</h3>
                    <p className="font-bold text-gray-200 text-xl">Dark Mater | KALI MCP Server</p>
                    <p className="text-gray-400 mt-2 text-sm">A robust, secure, and scalable server solution for managing model contexts and data integrations.</p>
                  </div>
                </div>

                {/* Product 2 */}
                 <div className="relative">
                  <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-[#63bb33]/50"></div>
                  <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-[#63bb33]/50"></div>
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-[#63bb33]/50"></div>
                  <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-[#63bb33]/50"></div>
                  <div className="bg-gray-900/50 border border-[#63bb33]/30 p-8 h-full">
                    <h3 className="text-lg text-[#63bb33] mb-3">// MODULE_02: CLIENT</h3>
                    <p className="font-bold text-gray-200 text-xl">Dark Mater | MCP Client Dashboard</p>
                    <p className="text-gray-400 mt-2 text-sm">Connect to all your MCP servers from a single, unified, and powerful client interface.</p>
                  </div>
                </div>
              </div>
            </div>
            <Footer />
        </section>
      </div>
    </div>
  );
};

export default LandingPage;