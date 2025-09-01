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
    content: 'W 60 sekund otrzymałam analizę, na którą wcześniej potrzebowałam tygodnia. AI odkryła możliwości, których sama bym nie zauważyła.',
    rating: 5,
    avatar: 'AK',
    gradient: 'from-blue-500 to-purple-600'
  },
  {
    name: 'Marcin Nowak',
    company: 'GrowthLab',
    role: 'Marketing Director',
    content: 'Dzięki analizie konkurencji zwiększyliśmy sprzedaż o 150% w 3 miesiące. To najlepsza inwestycja w rozwój firmy.',
    rating: 5,
    avatar: 'MN',
    gradient: 'from-green-500 to-teal-600'
  },
  {
    name: 'Katarzyna Wiśniewska',
    company: 'Digital Agency Pro',
    role: 'Strategy Lead',
    content: 'Analiza AI jest tak precyzyjna, że mogę natychmiast wdrażać rekomendacje. Oszczędzam 20 godzin tygodniowo.',
    rating: 5,
    avatar: 'KW',
    gradient: 'from-purple-500 to-pink-600'
  }
];

const companyLogos = [
  { name: 'TechStart', logo: 'TS' },
  { name: 'GrowthLab', logo: 'GL' },
  { name: 'Digital Pro', logo: 'DP' },
  { name: 'InnovateCorp', logo: 'IC' },
  { name: 'ScaleUp', logo: 'SU' },
  { name: 'BusinessAI', logo: 'BA' }
];

const stats = [
  { value: 2147, label: 'Firm przeanalizowanych', icon: Users, suffix: '+' },
  { value: 150, label: 'Średni wzrost sprzedaży', icon: TrendingUp, suffix: '%' },
  { value: 60, label: 'Sekund na analizę', icon: Zap, suffix: '' },
  { value: 4.9, label: 'Średnia ocena', icon: Star, suffix: '/5' }
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
      className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200/30 rounded-full blur-xl" />
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-200/30 rounded-full blur-xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section header */}
        <div 
          className={`text-center mb-16 transition-all duration-1000 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Dołącz do Tysięcy
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Zadowolonych Przedsiębiorców
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Firmy z całej Polski już wykorzystują moc AI do rozwoju swojego biznesu
          </p>
        </div>

        {/* Stats grid */}
        <div 
          className={`grid grid-cols-2 md:grid-cols-4 gap-8 mb-20 transition-all duration-1000 transform ${
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
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
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
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-2xl border border-white/20">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className={`w-16 h-16 bg-gradient-to-br ${testimonials[currentTestimonial].gradient} rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                    {testimonials[currentTestimonial].avatar}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-4">
                    <Quote className="w-8 h-8 text-blue-500 mr-2" />
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                  <blockquote className="text-lg md:text-xl text-gray-800 mb-6 leading-relaxed">
                    "{testimonials[currentTestimonial].content}"
                  </blockquote>
                  <div>
                    <cite className="font-semibold text-gray-900 text-lg">
                      {testimonials[currentTestimonial].name}
                    </cite>
                    <p className="text-blue-600 font-medium">
                      {testimonials[currentTestimonial].role}, {testimonials[currentTestimonial].company}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Testimonial indicators */}
            <div className="flex justify-center space-x-3 mt-6">
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
          <p className="text-center text-gray-600 mb-8 font-medium">
            Zaufały nam firmy z różnych branż
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
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