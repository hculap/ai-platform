import React from 'react';
import { useTranslation } from 'react-i18next';
import { LoadingState } from '../types';

interface LoadingSectionProps {
  loadingState: LoadingState;
}

const LoadingSection: React.FC<LoadingSectionProps> = ({ loadingState }) => {
  const { t } = useTranslation();

  return (
    <section className="px-6 py-12">
      <div className="max-w-2xl mx-auto text-center">
        <div className="animate-fade-in">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('loading.title')}</h2>
            <p className="text-lg text-gray-700 mb-8">{t('loading.description')}</p>
          
            {/* Progress Waves */}
            <div className="max-w-md mx-auto">
              <div className="flex justify-center items-end space-x-1 mb-6">
                {Array.from({ length: 7 }).map((_, index) => (
                  <div
                    key={index}
                    className="w-2 h-8 bg-gradient-to-t from-blue-500 to-purple-600 rounded-full animate-wave"
                    style={{
                      animationDelay: `${index * 0.1}s`,
                      animationDuration: '1.2s'
                    }}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600 font-medium">{loadingState.text}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoadingSection;
