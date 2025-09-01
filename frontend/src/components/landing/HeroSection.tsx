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
  const [animatedCount, setAnimatedCount] = useState(0);

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
          setAnimatedCount(targetCount);
          clearInterval(timer);
        } else {
          setAnimatedCount(Math.floor(currentCount));
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
          <span>Już <span className="font-bold text-blue-600">{animatedCount.toLocaleString()}</span> firm zaufało naszej AI</span>
          <Sparkles className="w-4 h-4 text-yellow-500" />
        </div>

        {/* Main headline */}
        <div className={`transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent">
              Odkryj Moc
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent relative">
              Swojego Biznesu
              <div className="absolute -top-2 -right-8 animate-bounce">
                <Zap className="w-8 h-8 text-yellow-400" />
              </div>
            </span>
            <br />
            <span className="text-4xl md:text-5xl lg:text-6xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              w 60 Sekund
            </span>
          </h1>
        </div>

        {/* Subheading */}
        <div 
          className={`transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
          style={{ transitionDelay: '0.4s' }}
        >
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            Nasza <span className="font-semibold text-blue-600">sztuczna inteligencja</span> przeanalizuje Twoją stronę w sekundach 
            i dostarczy <span className="font-semibold text-purple-600">kompleksowe wglądy biznesowe</span>, 
            których potrzebujesz do wzrostu.
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
                placeholder="Wprowadź adres swojej strony (np. mojafirma.pl, example.com)"
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
                    <span>Analizuj Za Darmo</span>
                    <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </button>
              
              <div className="flex items-center justify-center space-x-2 text-gray-500">
                <span>lub</span>
                <button
                  type="button"
                  onClick={onSkipToForm}
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                >
                  przejdź do formularza
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Key benefits */}
        <div 
          className={`grid md:grid-cols-3 gap-8 max-w-4xl mx-auto transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
          style={{ transitionDelay: '0.8s' }}
        >
          <div className="flex items-center space-x-3 justify-center md:justify-start">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">60 sekund</h3>
              <p className="text-gray-600">Natychmiastowa analiza</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 justify-center md:justify-start">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">100% AI</h3>
              <p className="text-gray-600">Precyzyjne wglądy</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 justify-center md:justify-start">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">Darmowy Start</h3>
              <p className="text-gray-600">Bez zobowiązań</p>
            </div>
          </div>
        </div>

        {/* Floating demo preview cards */}
        <div className="absolute top-1/2 left-4 transform -translate-y-1/2 hidden lg:block">
          <div className="w-64 h-32 bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-4 border border-white/20 animate-float" style={{ animationDelay: '0s' }}>
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-sm font-medium">Analiza zakończona</span>
            </div>
            <div className="text-xs text-gray-600">
              <p>• Grupa docelowa: Przedsiębiorcy 25-45 lat</p>
              <p>• USP: Innowacyjne rozwiązania IT</p>
            </div>
          </div>
        </div>

        <div className="absolute top-1/3 right-4 transform -translate-y-1/2 hidden lg:block">
          <div className="w-56 h-28 bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-4 border border-white/20 animate-float" style={{ animationDelay: '2s' }}>
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-sm font-medium">Konkurencja</span>
            </div>
            <div className="text-xs text-gray-600">
              <p>Znaleziono 8 głównych konkurentów</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;