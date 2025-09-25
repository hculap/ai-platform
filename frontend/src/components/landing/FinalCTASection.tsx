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

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        {/* Main CTA */}
        <div 
          className={`text-center mb-20 transition-all duration-1000 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-medium backdrop-blur-md">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>Dołącz do {animatedStats[0]?.toLocaleString() || '2000+'} zadowolonych firm</span>
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>

          <h2 className="mb-8 text-3xl font-extrabold leading-tight sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="text-white">Przestań Płacić</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Za Chaos.
            </span>
          </h2>

          <p className="mx-auto mb-12 max-w-4xl text-base leading-relaxed text-blue-100 sm:text-xl md:text-2xl">
            Jeden AI Growth OS zastępuje dziesiątki narzędzi i cały dział marketingu. 
            <br />
            <span className="font-semibold text-white">Oszczędzaj 60-80% kosztów przy 10x lepszych wynikach.</span>
          </p>

          {/* Quick start form */}
          <div className="mx-auto mb-12 w-full max-w-2xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="text"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                placeholder="Wprowadź URL i uruchom kompletny AI Growth OS"
                className="w-full rounded-2xl border border-white/30 bg-white/10 px-5 py-4 text-base text-white placeholder-blue-200 transition-all duration-300 focus:border-blue-400 focus:bg-white/20 focus:outline-none sm:px-7 sm:py-5 sm:text-lg"
              />
              <button
                onClick={handleAnalyze}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-4 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg sm:w-auto sm:px-7 sm:text-base"
                type="button"
              >
                <Zap className="h-5 w-5" />
                <span>Uruchom AI Growth OS</span>
              </button>
            </div>
          </div>

          {/* Alternative CTAs */}
          <div className="mb-16 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <button 
              onClick={onSignUp}
              className="flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-4 text-sm font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl sm:px-10 sm:py-5 sm:text-lg"
            >
              <CheckCircle className="w-6 h-6" />
              <span>Testuj AI Growth OS</span>
              <ArrowRight className="w-6 h-6" />
            </button>
            
            <div className="text-sm text-blue-200">
              <span>lub </span>
              <button 
                onClick={onSignUp}
                className="font-medium text-white transition-colors hover:text-blue-300 underline"
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
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:p-8">
            <div className="mb-8 text-center">
              <h3 className="mb-4 text-xl font-bold sm:text-2xl">Dlaczego musisz przejść na AI Growth OS już dziś?</h3>
              
              {/* Rotating urgency reasons */}
              <div className="relative h-28 overflow-hidden sm:h-24">
                {urgencyReasons.map((reason, index) => {
                  const Icon = reason.icon;
                  return (
                    <div 
                      key={index}
                      className={`absolute inset-0 flex items-center justify-center gap-4 transition-all duration-500 ${
                        index === currentUrgency 
                          ? 'translate-y-0 opacity-100' 
                          : index < currentUrgency 
                            ? '-translate-y-full opacity-0' 
                            : 'translate-y-full opacity-0'
                      }`}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-600">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="max-w-md text-left">
                        <h4 className="mb-1 text-sm font-semibold text-white sm:text-base">{reason.title}</h4>
                        <p className="text-xs text-blue-200 sm:text-sm">{reason.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fake countdown timer */}
            <div className="text-center">
              <p className="mb-4 text-sm text-blue-200 sm:text-base">Specjalna oferta kończy się za:</p>
              <div className="inline-flex items-center gap-3 rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-600/20 to-orange-600/20 p-4 backdrop-blur-sm sm:gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white sm:text-3xl">{timeLeft.hours.toString().padStart(2, '0')}</div>
                  <div className="text-xs text-red-200">godzin</div>
                </div>
                <div className="text-xl text-red-300 sm:text-2xl">:</div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white sm:text-3xl">{timeLeft.minutes.toString().padStart(2, '0')}</div>
                  <div className="text-xs text-red-200">minut</div>
                </div>
                <div className="text-xl text-red-300 sm:text-2xl">:</div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white sm:text-3xl">{timeLeft.seconds.toString().padStart(2, '0')}</div>
                  <div className="text-xs text-red-200">sekund</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final stats */}
        <div 
          className={`mb-16 grid grid-cols-1 gap-6 transition-all duration-1000 transform sm:grid-cols-2 lg:grid-cols-4 lg:gap-8 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
          style={{ transitionDelay: '0.4s' }}
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm">
                  <Icon className="h-8 w-8 text-blue-300" />
                </div>
                <div className="mb-2 text-2xl font-bold text-white sm:text-3xl">
                  {index === 2 ? animatedStats[index].toFixed(1) : animatedStats[index].toLocaleString()}
                  <span className="text-blue-400">{stat.suffix || ''}</span>
                </div>
                <p className="text-sm text-blue-200">{stat.label}</p>
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
          <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 backdrop-blur-sm sm:p-8">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-4 left-4 w-20 h-20 border border-white rounded-full" />
              <div className="absolute bottom-4 right-4 w-16 h-16 border border-white rounded-full" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white rounded-full opacity-50" />
            </div>

            <div className="relative z-10 mx-auto max-w-4xl">
              <Globe className="mx-auto mb-6 h-14 w-14 text-blue-400 sm:h-16 sm:w-16" />
              <h3 className="mb-4 text-2xl font-bold sm:text-3xl">
                Twój biznes zasługuje na jeden kompletny system
              </h3>
              <p className="mb-8 text-base leading-relaxed text-blue-100 sm:text-lg md:text-xl">
                Ponad 3240 firm już przeszło na AI Growth OS i oszczędza 60-80% kosztów. 
                <br />
                <span className="font-semibold text-white">Przestań płacić za chaos. Przejdź na jedną platformę.</span>
              </p>
              
              <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
                <button 
                  onClick={onSignUp}
                  className="rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 text-sm font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl sm:px-12 sm:py-5 sm:text-lg"
                >
                  <div className="flex items-center justify-center gap-3">
                    <Sparkles className="h-6 w-6" />
                    <span>Uruchom AI Growth OS Bezpłatnie</span>
                    <ArrowRight className="h-6 w-6" />
                  </div>
                </button>
              </div>
              
              <p className="mt-6 text-sm text-blue-200">
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
