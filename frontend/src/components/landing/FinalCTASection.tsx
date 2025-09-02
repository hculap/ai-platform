import React, { useState, useEffect } from 'react';
import { ArrowRight, Zap, Users, Clock, Star, Globe, CheckCircle, Sparkles, TrendingUp } from 'lucide-react';

interface FinalCTASectionProps {
  isVisible: boolean;
  onAnalyze: (url: string) => void;
  onSignUp: () => void;
}

const stats = [
  { value: 3240, label: 'Firm używa AI Growth OS', icon: Users },
  { value: 187, label: 'Średni wzrost wydajności', icon: TrendingUp, suffix: '%' },
  { value: 4.9, label: 'Ocena platformy', icon: Star, suffix: '/5' },
  { value: 24, label: 'Godzin oszczędności tygodniowo', icon: Clock }
];

const urgencyReasons = [
  {
    icon: Clock,
    title: 'Każdy dzień kosztuje Cię więcej',
    description: 'Płacisz za dziesiątki narzędzi, gdy mógłbyś mieć wszystko w jednym AI Growth OS'
  },
  {
    icon: TrendingUp,
    title: 'Konkurencja już ma przewagę',
    description: 'Firmy z AI Growth OS rosną 187% szybciej niż te używające rozproszonych narzędzi'
  },
  {
    icon: Users,
    title: 'Twój zespół pracuje nieefektywnie',
    description: '24h dziennie tracone na przełączanie między narzędziami - AI Growth OS kończy z tym'
  }
];

const FinalCTASection: React.FC<FinalCTASectionProps> = ({ isVisible, onAnalyze, onSignUp }) => {
  const [animatedStats, setAnimatedStats] = useState(stats.map(() => 0));
  const [currentUrgency, setCurrentUrgency] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 45, seconds: 12 });
  const [demoUrl, setDemoUrl] = useState('');

  // Animate stats when visible
  useEffect(() => {
    if (isVisible) {
      stats.forEach((stat, index) => {
        const duration = 2000;
        const targetValue = stat.value;
        const increment = targetValue / (duration / 16);
        let currentValue = 0;
        
        const timer = setInterval(() => {
          currentValue += increment;
          if (currentValue >= targetValue) {
            setAnimatedStats(prev => {
              const newStats = [...prev];
              newStats[index] = targetValue;
              return newStats;
            });
            clearInterval(timer);
          } else {
            setAnimatedStats(prev => {
              const newStats = [...prev];
              newStats[index] = Math.floor(currentValue);
              return newStats;
            });
          }
        }, 16);
      });
    }
  }, [isVisible]);

  // Cycle through urgency reasons
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentUrgency((prev) => (prev + 1) % urgencyReasons.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer (fake urgency)
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        let newSeconds = prev.seconds - 1;
        let newMinutes = prev.minutes;
        let newHours = prev.hours;

        if (newSeconds < 0) {
          newSeconds = 59;
          newMinutes -= 1;
        }
        if (newMinutes < 0) {
          newMinutes = 59;
          newHours -= 1;
        }
        if (newHours < 0) {
          newHours = 23;
          newMinutes = 59;
          newSeconds = 59;
        }

        return { hours: newHours, minutes: newMinutes, seconds: newSeconds };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleAnalyze = () => {
    if (demoUrl.trim()) {
      onAnalyze(demoUrl);
    } else {
      onSignUp();
    }
  };

  return (
    <section 
      id="final-cta" 
      data-section 
      className="py-20 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white relative overflow-hidden"
    >
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-float-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${4 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Main CTA */}
        <div 
          className={`text-center mb-20 transition-all duration-1000 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <div className="inline-flex items-center space-x-2 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-sm font-medium mb-8">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>Dołącz do {animatedStats[0]?.toLocaleString() || '2000+'} zadowolonych firm</span>
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>

          <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-8 leading-tight">
            <span className="text-white">Przestań Płacić</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Za Chaos.
            </span>
          </h2>

          <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto mb-12 leading-relaxed">
            Jeden AI Growth OS zastępuje dziesiątki narzędzi i cały dział marketingu. 
            <br />
            <span className="font-semibold text-white">Oszczędzaj 60-80% kosztów przy 10x lepszych wynikach.</span>
          </p>

          {/* Quick start form */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <input
                type="text"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                placeholder="Wprowadź URL i uruchom kompletny AI Growth OS"
                className="w-full px-8 py-6 text-lg bg-white/10 backdrop-blur-sm border border-white/30 rounded-2xl text-white placeholder-blue-200 focus:outline-none focus:border-blue-400 focus:bg-white/20 transition-all duration-300"
              />
              <button
                onClick={handleAnalyze}
                className="absolute right-2 top-2 bottom-2 px-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
              >
                <Zap className="w-5 h-5" />
                <span>Uruchom AI Growth OS</span>
              </button>
            </div>
          </div>

          {/* Alternative CTAs */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <button 
              onClick={onSignUp}
              className="px-10 py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg font-bold rounded-2xl hover:shadow-2xl transform hover:scale-110 transition-all duration-300 flex items-center space-x-3"
            >
              <CheckCircle className="w-6 h-6" />
              <span>Testuj AI Growth OS</span>
              <ArrowRight className="w-6 h-6" />
            </button>
            
            <div className="text-blue-200 text-sm">
              <span>lub </span>
              <button 
                onClick={onSignUp}
                className="text-white hover:text-blue-300 underline font-medium transition-colors"
              >
                zobacz platformę w akcji
              </button>
            </div>
          </div>
        </div>

        {/* Urgency section */}
        <div 
          className={`mb-16 transition-all duration-1000 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
          style={{ transitionDelay: '0.2s' }}
        >
          <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-4">Dlaczego musisz przejść na AI Growth OS już dziś?</h3>
              
              {/* Rotating urgency reasons */}
              <div className="relative h-24 overflow-hidden">
                {urgencyReasons.map((reason, index) => {
                  const Icon = reason.icon;
                  return (
                    <div 
                      key={index}
                      className={`absolute inset-0 flex items-center justify-center space-x-4 transition-all duration-500 transform ${
                        index === currentUrgency 
                          ? 'translate-y-0 opacity-100' 
                          : index < currentUrgency 
                            ? '-translate-y-full opacity-0' 
                            : 'translate-y-full opacity-0'
                      }`}
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left max-w-md">
                        <h4 className="font-semibold text-white mb-1">{reason.title}</h4>
                        <p className="text-blue-200 text-sm">{reason.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fake countdown timer */}
            <div className="text-center">
              <p className="text-blue-200 mb-4">Specjalna oferta kończy się za:</p>
              <div className="inline-flex items-center space-x-4 bg-gradient-to-r from-red-600/20 to-orange-600/20 backdrop-blur-sm rounded-2xl p-4 border border-red-500/30">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{timeLeft.hours.toString().padStart(2, '0')}</div>
                  <div className="text-xs text-red-200">godzin</div>
                </div>
                <div className="text-red-300 text-xl">:</div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{timeLeft.minutes.toString().padStart(2, '0')}</div>
                  <div className="text-xs text-red-200">minut</div>
                </div>
                <div className="text-red-300 text-xl">:</div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{timeLeft.seconds.toString().padStart(2, '0')}</div>
                  <div className="text-xs text-red-200">sekund</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final stats */}
        <div 
          className={`grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 transition-all duration-1000 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
          style={{ transitionDelay: '0.4s' }}
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
                  <Icon className="w-8 h-8 text-blue-300" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-white mb-2">
                  {index === 2 ? animatedStats[index].toFixed(1) : animatedStats[index].toLocaleString()}
                  <span className="text-blue-400">{stat.suffix || ''}</span>
                </div>
                <p className="text-blue-200 text-sm">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Final push */}
        <div 
          className={`text-center transition-all duration-1000 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
          style={{ transitionDelay: '0.6s' }}
        >
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-3xl p-8 border border-white/20 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-4 left-4 w-20 h-20 border border-white rounded-full" />
              <div className="absolute bottom-4 right-4 w-16 h-16 border border-white rounded-full" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white rounded-full opacity-50" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto">
              <Globe className="w-16 h-16 text-blue-400 mx-auto mb-6" />
              <h3 className="text-3xl font-bold mb-4">
                Twój biznes zasługuje na jeden kompletny system
              </h3>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Ponad 3240 firm już przeszło na AI Growth OS i oszczędza 60-80% kosztów. 
                <br />
                <span className="font-semibold text-white">Przestań płacić za chaos. Przejdź na jedną platformę.</span>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={onSignUp}
                  className="px-12 py-5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-bold rounded-2xl hover:shadow-2xl transform hover:scale-110 transition-all duration-300"
                >
                  <div className="flex items-center justify-center space-x-3">
                    <Sparkles className="w-6 h-6" />
                    <span>Uruchom AI Growth OS Bezpłatnie</span>
                    <ArrowRight className="w-6 h-6" />
                  </div>
                </button>
              </div>
              
              <p className="text-blue-200 text-sm mt-6">
                ✓ 14 dni pełna wersja za darmo ✓ Gwarancja sukcesu lub zwrot ✓ Anuluj w każdej chwili
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;