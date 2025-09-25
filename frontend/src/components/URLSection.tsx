import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ArrowRight, Lightbulb, Zap, CheckCircle } from 'lucide-react';

interface URLSectionProps {
  onAnalyze: (url: string) => void;
  onSkipToForm: () => void;
  isAnalyzing: boolean;
}

const URLSection: React.FC<URLSectionProps> = ({ onAnalyze, onSkipToForm, isAnalyzing }) => {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');

  const normalizeUrl = (inputUrl: string): string => {
    let cleanUrl = inputUrl.trim().toLowerCase();
    
    // Remove any existing protocol
    cleanUrl = cleanUrl.replace(/^https?:\/\//, '');
    
    // Add www. if it's missing and it's a simple domain
    if (!cleanUrl.startsWith('www.') && !cleanUrl.includes('/') && cleanUrl.includes('.')) {
      cleanUrl = 'www.' + cleanUrl;
    }
    
    // Add https:// protocol
    return 'https://' + cleanUrl;
  };

  const isValidDomain = (url: string): boolean => {
    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    const urlWithoutProtocol = url.replace(/^https?:\/\/(www\.)?/, '');
    const domain = urlWithoutProtocol.split('/')[0];
    
    return domainRegex.test(domain) || domain.includes('.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      alert(t('validation.enterUrl'));
      return;
    }

    // Check if it looks like a valid domain
    if (!isValidDomain(url)) {
      alert(t('validation.validUrl'));
      return;
    }

    // Normalize the URL
    const normalizedUrl = normalizeUrl(url);
    
    // Final validation with the normalized URL
    try {
      new URL(normalizedUrl);
      onAnalyze(normalizedUrl);
    } catch {
      alert(t('validation.urlRequired'));
      return;
    }
  };

  return (
    <section className="px-4 py-10 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl text-center">
        <div className="animate-fade-in">
          <h1 className="mb-6 text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
            <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent">
              {t('url.title.analyze')}
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('url.title.business')}
            </span>
          </h1>
          
          <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-gray-600 sm:mb-12 sm:text-lg">
            {t('url.description')}
          </p>
        </div>

        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="mx-auto max-w-2xl">
            <form onSubmit={handleSubmit} className="relative">
              <div className="relative group">
                <input 
                  type="text" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={t('url.placeholder')}
                  className="input-glow w-full rounded-2xl border-2 border-gray-200 bg-white px-5 py-4 text-base transition-all duration-300 focus:border-blue-500 focus:outline-none group-hover:border-gray-300 sm:px-8 sm:py-6 sm:text-lg"
                  required
                  disabled={isAnalyzing}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-6">
                  <Globe className="w-6 h-6 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              </div>
              
              <div className="mt-8 space-y-4">
                <button 
                  type="submit" 
                  disabled={isAnalyzing}
                  className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-base font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:from-blue-700 hover:to-purple-700 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none sm:w-auto sm:px-12 sm:text-lg"
                >
                  {isAnalyzing ? t('url.button.analyzing') : t('url.button.analyze')}
                  <ArrowRight className="inline-block ml-2 w-5 h-5" />
                </button>
                
                <div className="flex flex-col items-center justify-center gap-1 text-sm text-gray-500 sm:flex-row sm:gap-2 sm:text-base">
                  <span>{t('url.or')}</span>
                  <button
                    type="button"
                    onClick={onSkipToForm}
                    className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                  >
                    {t('url.skipToForm')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 gap-6 animate-slide-up sm:mt-20 sm:grid-cols-3 sm:gap-8" style={{ animationDelay: '0.4s' }}>
          <div className="rounded-2xl border border-gray-200 bg-white/70 p-6 transition-all duration-300 hover:shadow-lg backdrop-blur-sm">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('features.ai.title')}</h3>
            <p className="text-gray-600">{t('features.ai.description')}</p>
          </div>
          
          <div className="rounded-2xl border border-gray-200 bg-white/70 p-6 transition-all duration-300 hover:shadow-lg backdrop-blur-sm">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('features.instant.title')}</h3>
            <p className="text-gray-600">{t('features.instant.description')}</p>
          </div>
          
          <div className="rounded-2xl border border-gray-200 bg-white/70 p-6 transition-all duration-300 hover:shadow-lg backdrop-blur-sm">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('features.actionable.title')}</h3>
            <p className="text-gray-600">{t('features.actionable.description')}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default URLSection;
