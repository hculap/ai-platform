import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ArrowRight, Sparkles, Zap, TrendingUp } from 'lucide-react';

interface HeroSectionProps {
  onAnalyze: (url: string) => void;
  onSkipToForm: () => void;
  isAnalyzing: boolean;
  isVisible: boolean;
  scrollY: number;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  onAnalyze,
  onSkipToForm,
  isAnalyzing,
  isVisible,
  scrollY
}) => {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [isValid, setIsValid] = useState(false);
  // const [animatedCount, setAnimatedCount] = useState(0);

  const normalizeUrl = (inputUrl: string): string => {
    let cleanUrl = inputUrl.trim().toLowerCase();
    cleanUrl = cleanUrl.replace(/^https?:\/\//, '');
    if (!cleanUrl.startsWith('www.') && !cleanUrl.includes('/') && cleanUrl.includes('.')) {
      cleanUrl = 'www.' + cleanUrl;
    }
    return 'https://' + cleanUrl;
  };

  const isValidDomain = (url: string): boolean => {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    const urlWithoutProtocol = url.replace(/^https?:\/\/(www\.)?/, '');
    const domain = urlWithoutProtocol.split('/')[0];
    return domainRegex.test(domain) || domain.includes('.');
  };

  useEffect(() => {
    setIsValid(url.length > 0 && isValidDomain(url));
  }, [url]);

  // Animated counter effect
  useEffect(() => {
    if (isVisible) {
      const targetCount = 2147;
      const duration = 2000;
      const increment = targetCount / (duration / 16);
      let currentCount = 0;
      
      const timer = setInterval(() => {
        currentCount += increment;
        if (currentCount >= targetCount) {
          // setAnimatedCount(targetCount);
          clearInterval(timer);
        } else {
          // setAnimatedCount(Math.floor(currentCount));
        }
      }, 16);

      return () => clearInterval(timer);
    }
  }, [isVisible]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !isValid) return;
    
    const normalizedUrl = normalizeUrl(url);
    try {
      new URL(normalizedUrl);
      onAnalyze(normalizedUrl);
    } catch {
      alert(t('validation.urlRequired'));
    }
  };

  return (
    <section 
      id="hero" 
      data-section 
      className="min-h-screen flex items-center justify-center px-6 py-20 relative"
    >
      {/* Parallax background elements */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{ transform: `translateY(${scrollY * 0.1}px)` }}
      >
        <div className="absolute top-20 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
        <div className="absolute top-40 right-1/3 w-1 h-1 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 left-1/2 w-3 h-3 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-6xl mx-auto text-center relative z-10">
        {/* Trust indicator */}
        <div
          className={`inline-flex items-center space-x-2 px-4 py-2 mb-8 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-sm font-medium text-gray-700 transition-all duration-1000 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
          style={{ transitionDelay: '0.2s' }}
        >
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>11 narzędzi AI dla rozwoju Twojego biznesu</span>
          <Sparkles className="w-4 h-4 text-yellow-500" />
        </div>

        {/* Main headline */}
        <div className={`transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              AI Business Growth Toolkit
            </span>
          </h1>

          <p className="text-xl md:text-3xl lg:text-4xl font-medium mb-6 text-gray-900">
            Od analizy strony do kampanii reklamowych
          </p>
        </div>

        {/* Value proposition */}
        <div 
          className={`transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
          style={{ transitionDelay: '0.4s' }}
        >
          <p className="text-lg md:text-2xl lg:text-3xl max-w-3xl mx-auto font-medium mb-12 text-gray-900">
            Wszystko czego potrzebujesz do rozwoju biznesu z AI
          </p>
        </div>

        {/* URL Input Form */}
        <div 
          className={`max-w-3xl mx-auto mb-12 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
          style={{ transitionDelay: '0.6s' }}
        >
          <form onSubmit={handleSubmit} className="relative group">
            <div className="relative">
              <input 
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Wprowadź adres swojej strony (np. mojafirma.pl)"
                className={`w-full px-8 py-6 text-lg bg-white/90 backdrop-blur-sm border-2 rounded-2xl focus:outline-none transition-all duration-300 pr-20 ${
                  url.length === 0 
                    ? 'border-gray-200 focus:border-blue-500' 
                    : isValid 
                      ? 'border-green-500 focus:border-green-600' 
                      : 'border-red-500 focus:border-red-600'
                } shadow-lg hover:shadow-xl group-hover:scale-[1.02]`}
                required
                disabled={isAnalyzing}
              />
              
              {/* Input status indicator */}
              <div className="absolute inset-y-0 right-4 flex items-center">
                {url.length > 0 && (
                  isValid ? (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )
                )}
                {url.length === 0 && (
                  <Globe className="w-6 h-6 text-gray-400 group-hover:text-gray-600 transition-colors" />
                )}
              </div>
            </div>
            
            {/* Submit button */}
            <div className="mt-8 space-y-4">
              <button 
                type="submit" 
                disabled={isAnalyzing || !isValid}
                className={`px-12 py-4 text-lg font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                  isValid && !isAnalyzing
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-2xl hover:shadow-purple-500/25 hover:from-blue-700 hover:to-purple-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isAnalyzing ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analizuję...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5" />
                    <span>Uruchom AI Business Toolkit</span>
                    <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </button>
              
              <p className="text-sm text-gray-500 mt-3">
                Zestaw narzędzi AI za ułamek kosztu agencji
              </p>

              {/* Alternative CTA */}
              <div className="flex items-center justify-center space-x-4 mt-6 pt-4 border-t border-gray-200">
                <span className="text-gray-500 text-sm">lub</span>
                <button
                  type="button"
                  onClick={onSkipToForm}
                  className="px-6 py-3 bg-white/80 backdrop-blur-sm text-blue-600 font-semibold rounded-xl border border-blue-200 hover:bg-white hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  Zacznij bez URL - wypełnij formularz
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Key benefits */}
        <div 
          className={`grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
          style={{ transitionDelay: '0.8s' }}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-3">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">Analiza</h3>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-3">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">Tworzenie</h3>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-3">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">Automatyzacja</h3>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-3">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">Marketing</h3>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;