import React from 'react';
import { LoadingState } from '../types';

interface LoadingSectionProps {
  loadingState: LoadingState;
}

const LoadingSection: React.FC<LoadingSectionProps> = ({ loadingState }) => {
  return (
    <section className="px-6 py-12">
      <div className="max-w-2xl mx-auto text-center">
        <div className="animate-fade-in">
          {/* Wave Loader */}
          <div className="flex justify-center items-center mb-8">
            <div className="flex space-x-1">
              <div className="w-2 h-8 bg-gradient-to-t from-blue-500 to-purple-600 rounded-full animate-wave" style={{animationDelay: '0s'}}></div>
              <div className="w-2 h-8 bg-gradient-to-t from-blue-500 to-purple-600 rounded-full animate-wave" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-8 bg-gradient-to-t from-blue-500 to-purple-600 rounded-full animate-wave" style={{animationDelay: '0.2s'}}></div>
              <div className="w-2 h-8 bg-gradient-to-t from-blue-500 to-purple-600 rounded-full animate-wave" style={{animationDelay: '0.3s'}}></div>
              <div className="w-2 h-8 bg-gradient-to-t from-blue-500 to-purple-600 rounded-full animate-wave" style={{animationDelay: '0.4s'}}></div>
              <div className="w-2 h-8 bg-gradient-to-t from-blue-500 to-purple-600 rounded-full animate-wave" style={{animationDelay: '0.5s'}}></div>
              <div className="w-2 h-8 bg-gradient-to-t from-blue-500 to-purple-600 rounded-full animate-wave" style={{animationDelay: '0.6s'}}></div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Analyzing Your Business</h2>
            <p className="text-lg text-gray-700 mb-8">Our AI is examining your website and extracting key business insights...</p>
          
            <div className="max-w-md mx-auto">
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${loadingState.progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-3 font-medium">{loadingState.text}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoadingSection;
