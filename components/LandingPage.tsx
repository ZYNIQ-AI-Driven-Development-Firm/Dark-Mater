import React, { useState, useEffect } from 'react';
import BackgroundGrid from './BackgroundGrid';
import Footer from './Footer';
import PricingSection from './PricingSection';

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
  



  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col bg-black">
      <BackgroundGrid />
      <div className="relative z-10 flex flex-col flex-grow min-h-screen">
        
        {/* Enhanced Hero Section */}
        <section id="hero" className="min-h-screen flex flex-col items-center justify-center text-center p-6 relative">
          {/* Enhanced Background Effects */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Animated particles */}
            <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-[#63bb33] rounded-full animate-pulse opacity-60"></div>
            <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-purple-400 rounded-full animate-pulse opacity-40" style={{animationDelay: '1s'}}></div>
            <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-[#63bb33] rounded-full animate-pulse opacity-50" style={{animationDelay: '2s'}}></div>
            <div className="absolute bottom-1/4 right-1/3 w-1 h-1 bg-purple-400 rounded-full animate-pulse opacity-70" style={{animationDelay: '0.5s'}}></div>
            
            {/* Glowing orbs */}
            <div className="absolute top-10 left-10 w-32 h-32 bg-[#63bb33]/5 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-400/5 rounded-full blur-xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
          </div>

          {/* Enhanced Logo Container */}
          <div className="relative w-80 mb-12 group">
            {/* Animated border */}
            <div className="absolute inset-0 border border-[#63bb33]/30 rounded-sm animate-pulse"></div>
            <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-[#63bb33] transition-all duration-300 group-hover:border-[#63bb33]/80"></div>
            <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-[#63bb33] transition-all duration-300 group-hover:border-[#63bb33]/80"></div>
            <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-[#63bb33] transition-all duration-300 group-hover:border-[#63bb33]/80"></div>
            <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-[#63bb33] transition-all duration-300 group-hover:border-[#63bb33]/80"></div>
            
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#63bb33]/10 via-transparent to-purple-400/10 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <img 
              src="https://raw.githubusercontent.com/khalilpreview/M7yapp9sColl3c1oncdn/refs/heads/main/dark_mater_white_inline_logo.png" 
              alt="Dark Matter Logo" 
              className="w-full h-auto logo-fade-pulse floating relative z-10 transition-transform duration-300 group-hover:scale-105" 
            />
          </div>

          <div className="w-full max-w-4xl mx-auto relative z-10">
            {/* Enhanced Terminal Interface */}
            <div className="bg-black/40 border border-[#63bb33]/30 rounded-lg p-8 backdrop-blur-sm shadow-2xl glow-pulse">
              {/* Terminal Header */}
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#63bb33]/20">
                <div className="w-3 h-3 rounded-full bg-red-500/60 animate-pulse"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/60 animate-pulse" style={{animationDelay: '0.5s'}}></div>
                <div className="w-3 h-3 rounded-full bg-[#63bb33]/60 animate-pulse" style={{animationDelay: '1s'}}></div>
                <span className="ml-4 text-sm md:text-base text-gray-500 font-mono">dark-matter-mcp:~$</span>
              </div>

              {/* Command Input */}
              <div className="text-xl md:text-2xl text-left mb-8 font-mono">
                <span className="text-[#63bb33]">root@dark-matter:~$ </span>
                <span className="text-white">{typedCommand}</span>
                {isTyping && <span className="terminal-cursor h-6 w-px ml-1"></span>}
              </div>
              
              {/* Enhanced Command Output */}
              <div className={`text-left space-y-8 transition-all duration-1000 transform ${showOutput ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="space-y-4">
                  <p className="text-gray-300 text-base md:text-lg leading-relaxed font-light">
                    Not just another AI chat. Our MCP agent remembers, learns, and grows with you turning conversations into long-term collaboration.
                  </p>
                  
                  <div className="border-l-2 border-[#63bb33]/50 pl-6 py-2">
                    <p className="text-[#63bb33] text-base md:text-lg font-semibold tracking-wide">
                      MCP + persistent, scoped memory + security-oriented workflows wrapped in a clean dashboard
                    </p>
                  </div>
                  
                  {/* Enhanced Architecture Diagram */}
                  <div className="bg-gray-900/50 border border-[#63bb33]/20 rounded-lg p-6 font-mono text-sm md:text-base">
                    <div className="flex flex-wrap items-center justify-center gap-2 text-center">
                      <span className="bg-purple-400/20 text-purple-300 px-3 py-1 rounded border border-purple-400/30 transition-colors hover:bg-purple-400/30">
                        [LLM / AI Agent]
                      </span>
                      <span className="text-[#63bb33]">⟷</span>
                      <span className="bg-purple-400/20 text-purple-300 px-3 py-1 rounded border border-purple-400/30 transition-colors hover:bg-purple-400/30">
                        [MCP Client]
                      </span>
                      <span className="text-[#63bb33]">⟷</span>
                      <span className="bg-purple-400/20 text-purple-300 px-3 py-1 rounded border border-purple-400/30 transition-colors hover:bg-purple-400/30">
                        [MCP Server]
                      </span>
                      <span className="text-[#63bb33]">⟷</span>
                      <span className="bg-purple-400/20 text-purple-300 px-3 py-1 rounded border border-purple-400/30 transition-colors hover:bg-purple-400/30">
                        [Tools/APIs/Data]
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Call to Action */}
              <div className={`mt-12 flex flex-col items-center justify-center gap-8 transition-all duration-1000 transform ${showCta ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <button
                  onClick={onEnter}
                  className="group relative text-xl md:text-2xl font-semibold px-12 py-6 border-2 border-dance rounded-lg bg-[#63bb33]/10 hover:bg-[#63bb33]/20 transition-all duration-300 transform hover:scale-105 slide-up shadow-lg hover:shadow-[#63bb33]/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#63bb33]/20 to-purple-400/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-[#63bb33]/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 animate-pulse"></div>
                  <span className="relative z-10 text-[#63bb33] group-hover:text-white transition-colors duration-300 font-mono tracking-wider">
                    [ INITIATE CONNECTION ]
                  </span>
                </button>
                
                {/* Status indicator */}
                <div className="text-sm md:text-base text-gray-500 font-mono opacity-60">
                  SYSTEM_STATUS: <span className="text-[#63bb33]">ONLINE</span> | READY_FOR_CONNECTION
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Solutions Section */}
        <section className="relative z-10 py-20 px-6 border-t border-[#63bb33]/20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl text-center text-[#63bb33] mb-16 font-mono tracking-wider">
              [ OUR_SOLUTIONS ]
            </h2>
            
            {/* Empty section - solutions will be added later */}
            <div className="flex flex-col items-center justify-center py-16">
              <div className="bg-gray-900/40 border border-[#63bb33]/30 rounded-lg p-8 max-w-md text-center">
                <div className="text-[#63bb33] text-4xl mb-4 font-mono">⧗</div>
                <p className="text-gray-300 text-lg mb-2 font-mono">Coming Soon</p>
                <p className="text-gray-500 text-sm">Our solutions are being crafted with precision.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section - Last section before footer */}
        <PricingSection />

        {/* Footer Section */}
        <div className="relative z-10">
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default LandingPage;