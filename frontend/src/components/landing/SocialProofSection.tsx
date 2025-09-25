import React, { useState, useEffect } from 'react';
import { Star, Quote, TrendingUp, Users, Zap } from 'lucide-react';

interface SocialProofSectionProps {
  isVisible: boolean;
}

const testimonials = [
  {
    name: 'Anna Kowalska',
    company: 'TechStart Solutions',
    role: 'CEO & Founder',
    content: 'AI Growth OS zastąpił mi cały dział marketingu. Strategista analizuje rynek, Creator tworzy treści, a Automation publikuje wszystko 24/7. Oszczędzam 40,000 zł miesięcznie.',
    rating: 5,
    avatar: 'AK',
    gradient: 'from-blue-500 to-purple-600',
    useCase: 'Team Replacement'
  },
  {
    name: 'Marcin Nowak',
    company: 'E-commerce Mastery',
    role: 'Founder',
    content: 'Wcześniej żonglowałem 12 narzędziami: analytics, social media, email marketing, design. Teraz mam wszystko w jednym miejscu. Wzrost sprzedaży o 240% w 4 miesiące.',
    rating: 5,
    avatar: 'MN',
    gradient: 'from-green-500 to-teal-600',
    useCase: 'Unified Platform'
  },
  {
    name: 'Katarzyna Wiśniewska',
    company: 'Creative Agency Pro',
    role: 'Agency Owner',
    content: 'Maya (AI Creator) produkuje treści szybciej niż moi 3 copywriterów razem wzięci. Viktor (AI Analyst) optymalizuje kampanie lepiej niż eksperci z wieloletnim doświadczeniem.',
    rating: 5,
    avatar: 'KW',
    gradient: 'from-purple-500 to-pink-600',
    useCase: 'AI Team Performance'
  },
  {
    name: 'Robert Zieliński',
    company: 'LocalBiz Solutions',
    role: 'Business Consultant',
    content: 'Automation w AI Growth OS działa jak szwajcarski zegarek. Moje kampanie działają samodzielnie, klienci dostają personalizowane treści, a ja fokusuje się na strategii.',
    rating: 5,
    avatar: 'RZ',
    gradient: 'from-orange-500 to-red-600',
    useCase: 'Full Automation'
  }
];

const companyLogos = [
  { name: 'TechStart Solutions', logo: 'TS' },
  { name: 'E-commerce Mastery', logo: 'EM' },
  { name: 'Creative Agency Pro', logo: 'CA' },
  { name: 'LocalBiz Solutions', logo: 'LB' },
  { name: 'SaaS Innovate', logo: 'SI' },
  { name: 'Digital Growth Hub', logo: 'DG' },
  { name: 'Marketing Pros', logo: 'MP' },
  { name: 'Scale Ventures', logo: 'SV' }
];

const stats = [
  { value: 3240, label: 'Firm używa AI Growth OS', icon: Users, suffix: '+' },
  { value: 187, label: 'Średni wzrost wydajności', icon: TrendingUp, suffix: '%' },
  { value: 24, label: 'Godzin oszczędności tygodniowo', icon: Zap, suffix: 'h' },
  { value: 4.9, label: 'Średnia ocena platformy', icon: Star, suffix: '/5' }
];

const SocialProofSection: React.FC<SocialProofSectionProps> = ({ isVisible }) => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [animatedStats, setAnimatedStats] = useState(stats.map(() => 0));

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <section 
      id="social-proof" 
      data-section 
      className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-blue-50 py-16 sm:py-20"
    >
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200/30 rounded-full blur-xl" />
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-200/30 rounded-full blur-xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section header */}
        <div 
          className={`text-center mb-16 transition-all duration-1000 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <h2 className="mb-6 text-3xl font-bold sm:text-4xl md:text-5xl">
            <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Dołącz do Tysięcy Firm
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Używających AI Growth OS
            </span>
          </h2>
          <p className="mx-auto max-w-3xl text-base text-gray-600 sm:text-lg md:text-xl">
            Od startupów po globalne korporacje - firmy z różnych branż zastąpiły dziesiątki narzędzi 
            jedną inteligentną platformą wzrostu
          </p>
        </div>

        {/* Stats grid */}
        <div 
          className={`mb-16 grid grid-cols-1 gap-6 transition-all duration-1000 transform sm:grid-cols-2 sm:gap-8 lg:mb-20 lg:grid-cols-4 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
          style={{ transitionDelay: '0.2s' }}
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={index}
                className="text-center p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl">
                  {index === 3 ? animatedStats[index].toFixed(1) : animatedStats[index].toLocaleString()}
                  <span className="text-blue-600">{stat.suffix}</span>
                </div>
                <p className="text-gray-600 font-medium">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Testimonials carousel */}
        <div 
          className={`mb-16 transition-all duration-1000 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
          style={{ transitionDelay: '0.4s' }}
        >
          <div className="relative max-w-4xl mx-auto">
            <div className="rounded-3xl border border-white/20 bg-white/80 p-6 shadow-2xl backdrop-blur-sm sm:p-8 md:p-12">
              <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                <div className="flex-shrink-0">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${testimonials[currentTestimonial].gradient} text-xl font-bold text-white shadow-lg sm:h-20 sm:w-20`}>
                    {testimonials[currentTestimonial].avatar}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Quote className="h-7 w-7 text-blue-500 sm:h-8 sm:w-8" />
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-current text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <blockquote className="mb-6 text-base leading-relaxed text-gray-800 sm:text-lg md:text-xl">
                    "{testimonials[currentTestimonial].content}"
                  </blockquote>
                  <div>
                    <cite className="text-lg font-semibold text-gray-900">
                      {testimonials[currentTestimonial].name}
                    </cite>
                    <p className="font-medium text-blue-600">
                      {testimonials[currentTestimonial].role}, {testimonials[currentTestimonial].company}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Testimonial indicators */}
            <div className="mt-6 flex justify-center space-x-3">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentTestimonial
                      ? 'bg-blue-600 w-8'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Company logos */}
        <div 
          className={`transition-all duration-1000 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
          style={{ transitionDelay: '0.6s' }}
        >
          <p className="mb-6 text-center text-sm font-medium text-gray-600 sm:mb-8 sm:text-base">
            Firmy z różnych branż zastąpiły swoje działy marketingu AI Growth OS
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 md:gap-10">
            {companyLogos.map((company, index) => (
              <div 
                key={index}
                className="group flex items-center justify-center"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-16 h-16 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
                  <span className="text-gray-700 font-bold text-lg group-hover:text-blue-600 transition-colors">
                    {company.logo}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;
