import React, { useState, useEffect } from 'react';
import { Brain, Target, TrendingUp, Globe, Users, Zap, Shield, Clock, ArrowRight } from 'lucide-react';

interface FeatureGalaxySectionProps {
  isVisible: boolean;
}

const features = [
  {
    id: 1,
    title: 'Strategia & Inteligencja',
    description: 'AI analizuje rynek, konkurencję i trendy, dostarczając głębokie wglądy biznesowe i strategie wzrostu oparte na danych.',
    icon: Brain,
    gradient: 'from-blue-500 to-purple-600',
    benefits: ['Analiza konkurencji w czasie rzeczywistym', 'Identyfikacja trendów rynkowych', 'Spersonalizowane strategie wzrostu', 'Predykcje i prognozy biznesowe'],
    stats: 'Miliony punktów danych dziennie',
    capabilities: ['Market Intelligence', 'Competitor Analysis', 'Trend Forecasting', 'Strategic Planning']
  },
  {
    id: 2,
    title: 'Tworzenie Treści',
    description: 'Zaawansowane AI tworzy wysokiej jakości treści: posty, reklamy, landing page, emaile - wszystko dostosowane do Twojej marki.',
    icon: Target,
    gradient: 'from-green-500 to-emerald-600',
    benefits: ['Posty na social media', 'Kampanie reklamowe', 'Landing pages', 'Email marketing', 'Copy dla e-commerce'],
    stats: '10000+ treści tworzone dziennie',
    capabilities: ['Content Generation', 'Brand Voice Adaptation', 'Multi-format Creation', 'A/B Testing']
  },
  {
    id: 3,
    title: 'Automatyzacja & Wykonanie',
    description: 'Inteligentne workflow\'y automatyzują publikowanie, zarządzanie kampaniami i optymalizację performance w czasie rzeczywistym.',
    icon: Zap,
    gradient: 'from-orange-500 to-red-600',
    benefits: ['Automatyczne publikowanie', 'Zarządzanie kampaniami', 'Optymalizacja budżetów', 'Monitorowanie wyników 24/7'],
    stats: '99.9% niezawodności automatyzacji',
    capabilities: ['Workflow Automation', 'Campaign Management', 'Performance Optimization', 'Real-time Monitoring']
  },
  {
    id: 4,
    title: 'Warstwa Asystentów',
    description: 'AI Asystenci specjalizujący się w różnych obszarach: Strategista, Creator, Analityk i Growth Manager - Twój cyfrowy zespół.',
    icon: Users,
    gradient: 'from-purple-500 to-pink-600',
    benefits: ['AI Strategista biznesowy', 'AI Creator treści', 'AI Analityk danych', 'AI Growth Manager', '24/7 dostępność'],
    stats: '4 specjalistycznych asystentów',
    capabilities: ['Strategic Guidance', 'Creative Direction', 'Data Analysis', 'Growth Management']
  }
];

const FeatureGalaxySection: React.FC<FeatureGalaxySectionProps> = ({ isVisible }) => {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<number | null>(null);

  return (
    <section 
      id="feature-galaxy" 
      data-section 
      className="py-20 bg-gradient-to-br from-gray-50 to-indigo-50 relative overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-200/30 to-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-green-200/30 to-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-indigo-100/20 to-purple-100/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section header */}
        <div 
          className={`text-center mb-20 transition-all duration-1000 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              4 Kluczowe Obszary
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Growth OS
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Każdy obszar to kompletny zestaw narzędzi AI, które wcześniej wymagały dziesiątek oddzielnych platform. 
            Teraz wszystko w jednym miejscu.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isHovered = hoveredFeature === feature.id;
            const isSelected = selectedFeature === feature.id;
            
            return (
              <div
                key={feature.id}
                className={`relative group cursor-pointer transition-all duration-700 transform ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
                } ${isHovered || isSelected ? 'scale-105 z-20' : 'hover:scale-105'}`}
                style={{ transitionDelay: `${index * 0.1}s` }}
                onMouseEnter={() => setHoveredFeature(feature.id)}
                onMouseLeave={() => setHoveredFeature(null)}
                onClick={() => setSelectedFeature(isSelected ? null : feature.id)}
              >
                {/* Card */}
                <div className={`h-full bg-white/80 backdrop-blur-sm rounded-3xl p-8 border-2 transition-all duration-500 ${
                  isHovered || isSelected 
                    ? 'border-transparent shadow-2xl' 
                    : 'border-white/50 shadow-lg hover:shadow-xl'
                } relative overflow-hidden`}>
                  
                  {/* Gradient overlay when hovered/selected */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-500 ${
                    isHovered || isSelected ? 'opacity-10' : ''
                  }`} />
                  
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${
                      isHovered || isSelected 
                        ? `bg-gradient-to-br ${feature.gradient} shadow-lg scale-110` 
                        : 'bg-gray-100 group-hover:bg-gradient-to-br group-hover:' + feature.gradient
                    }`}>
                      <Icon className={`w-8 h-8 transition-colors duration-500 ${
                        isHovered || isSelected ? 'text-white' : 'text-gray-600 group-hover:text-white'
                      }`} />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-gray-800">
                      {feature.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {feature.description}
                    </p>

                    {/* Stats badge */}
                    <div className="inline-flex items-center px-4 py-2 bg-gray-100/80 rounded-full text-sm font-medium text-gray-700 mb-6">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                      {feature.stats}
                    </div>

                    {/* Expandable benefits */}
                    <div className={`transition-all duration-500 overflow-hidden ${
                      isSelected ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <div className="border-t border-gray-200 pt-4 space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Kluczowe możliwości:</h4>
                          <ul className="space-y-2">
                            {feature.benefits.map((benefit, i) => (
                              <li key={i} className="flex items-start space-x-2 text-sm text-gray-600">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Główne funkcje:</h4>
                          <div className="flex flex-wrap gap-2">
                            {feature.capabilities.map((capability, i) => (
                              <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                {capability}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expand indicator */}
                    <div className="flex items-center justify-between mt-4">
                      <div className={`text-sm font-medium transition-colors ${
                        isHovered || isSelected ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {isSelected ? 'Zwiń szczegóły' : 'Zobacz szczegóły'}
                      </div>
                      <ArrowRight className={`w-4 h-4 transition-all duration-300 ${
                        isHovered || isSelected ? 'text-blue-600 translate-x-1' : 'text-gray-400'
                      } ${isSelected ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {/* Hover glow effect */}
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-500 blur-xl ${
                    isHovered ? 'opacity-20' : ''
                  }`} style={{ zIndex: -1 }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div 
          className={`text-center transition-all duration-1000 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
          style={{ transitionDelay: '0.8s' }}
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 left-4 w-16 h-16 border border-white rounded-full" />
              <div className="absolute bottom-4 right-4 w-20 h-20 border border-white rounded-full" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white rounded-full opacity-50" />
            </div>
            
            <div className="relative z-10 max-w-4xl mx-auto">
              <h3 className="text-3xl font-bold mb-4">
                4 Obszary = Kompletny Zespół AI
              </h3>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Zamiast zarządzać dziesiątkami narzędzi i specjalistów, masz jeden AI Growth OS, 
                który zastępuje cały dział marketingu i wzrostu.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                  Uruchom AI Growth OS
                </button>
                <button className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-2xl border border-white/30 hover:bg-white/30 transition-all duration-300">
                  Poznaj 4 Obszary
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating elements */}
      <div className="absolute top-32 left-10 w-3 h-3 bg-blue-400 rounded-full animate-ping opacity-60" />
      <div className="absolute top-64 right-16 w-2 h-2 bg-purple-400 rounded-full animate-pulse opacity-60" />
      <div className="absolute bottom-32 left-20 w-4 h-4 bg-green-400 rounded-full animate-bounce opacity-60" style={{ animationDelay: '1s' }} />
    </section>
  );
};

export default FeatureGalaxySection;