import React from 'react';
import { LoadingState } from '../types';

interface LoadingSectionProps {
  loadingState: LoadingState;
}

const LoadingSection: React.FC<LoadingSectionProps> = ({ loadingState }) => {
  return (
    <section className="px-6 py-20">
      <div className="max-w-2xl mx-auto text-center">
        <div className="animate-fade-in">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8">
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-white rounded-full loading-dot"></div>
              <div className="w-3 h-3 bg-white rounded-full loading-dot"></div>
              <div className="w-3 h-3 bg-white rounded-full loading-dot"></div>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Analyzing Your Business</h2>
          <p className="text-lg text-gray-600 mb-8">Our AI is examining your website and extracting key business insights...</p>
          
          <div className="max-w-md mx-auto">
            <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${loadingState.progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-3">{loadingState.text}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoadingSection;
