import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[#63bb33]/30 py-4 px-6 text-center text-xs text-gray-500 z-10 relative">
      <div className="flex flex-col md:flex-row justify-center items-center gap-2 md:gap-4">
        <span>© 2025 Dark Matter Crafted by <strong className="text-[#ea2323]">ZYNIQ</strong> (<strong className="text-[#ea2323]">ZYNIQ.SOLUTIONS</strong>). All rights reserved.</span>
        <span className="hidden md:inline">|</span>
        <a href="/privacy-policy" className="hover:text-[#63bb33] transition-colors">Privacy Policy</a>
        <span className="hidden md:inline">|</span>
        <a href="/terms-of-service" className="hover:text-[#63bb33] transition-colors">Terms of Service</a>
        <span className="hidden md:inline">|</span>
        <a href="/data-processing-addendum" className="hover:text-[#63bb33] transition-colors">Data Processing Addendum</a>
      </div>
    </footer>
  );
};

export default Footer;
