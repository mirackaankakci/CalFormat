import React from 'react';

const FloatingElements: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-[#ee7f1a]/10 to-[#e5b818]/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-[#d62d27]/10 to-[#ee7f1a]/10 rounded-full blur-xl animate-pulse delay-1000"></div>
      <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-gradient-to-br from-[#e5b818]/10 to-[#ee7f1a]/10 rounded-full blur-xl animate-pulse delay-2000"></div>
    </div>
  );
};

export default FloatingElements;