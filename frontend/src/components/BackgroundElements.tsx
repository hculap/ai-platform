import React from 'react';

const BackgroundElements: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full mesh-gradient opacity-20 animate-float"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full gradient-bg opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-10 animate-pulse-slow"></div>
    </div>
  );
};

export default BackgroundElements;
