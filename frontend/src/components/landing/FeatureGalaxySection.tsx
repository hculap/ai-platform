import React, { useState, useEffect } from 'react';
import { Brain, Target, TrendingUp, Globe, Users, Zap, Shield, Clock, ArrowRight } from 'lucide-react';

interface FeatureGalaxySectionProps {
  isVisible: boolean;
}

const features = [
  {
    id: 1,
    title: 'Analiza Biznesowa AI',
    description: 'Kompleksowa analiza Twojej strony internetowej w 60 sekund. AI wyodrębnia kluczowe informacje o Twoim biznesie.',
    icon: Brain,
    gradient: 'from-blue-500 to-purple-600',
    benefits: ['Automatyczna kategorizacja biznesu', 'Identyfikacja grupy docelowej', 'Analiza propozycji wartości'],
    stats: '2000+ analiz dziennie'
  },
  {
    id: 2,
    title: 'Badanie Konkurencji',
    description: 'AI znajduje i analizuje Twoich głównych konkurentów, ujawniając ich silne i słabe strony.',
    icon: Target,
    gradient: 'from-red-500 to-orange-600',
    benefits: ['Automatyczne wykrywanie konkurentów', 'Analiza pozycjonowania', 'Identyfikacja luk rynkowych'],
    stats: '500+ konkurentów dziennie'
  },
  {
    id: 3,
    title: 'Rekomendacje Wzrostu',
    description: 'Spersonalizowane strategie rozwoju oparte na analizie Twojego biznesu i rynku.',
    icon: TrendingUp,
    gradient: 'from-green-500 to-emerald-600',
    benefits: ['Konkretne działania do wdrożenia', 'Priorytetyzacja inicjatyw', 'Prognoza ROI'],
    stats: '150% średni wzrost'
  },
  {
    id: 4,
    title: 'Analiza Globalnych Trendów',
    description: 'Monitorowanie trendów branżowych i możliwości ekspansji na nowe rynki.',
    icon: Globe,
    gradient: 'from-indigo-500 to-blue-600',
    benefits: ['Trendy w czasie rzeczywistym', 'Analiza międzynarodowa', 'Prognozy rozwoju rynku'],
    stats: '50+ krajów objętych'
  },
  {
    id: 5,
    title: 'Segmentacja Klientów',
    description: 'Precyzyjna identyfikacja i analiza różnych segmentów Twojej grupy docelowej.',
    icon: Users,
    gradient: 'from-purple-500 to-pink-600',
    benefits: ['Persona klientów', 'Analiza behawioralna', 'Personalizacja komunikacji'],
    stats: '15+ segmentów średnio'
  },
  {
    id: 6,
    title: 'Optymalizacja w Czasie Rzeczywistym',
    description: 'Ciągłe monitorowanie i sugerowanie ulepszeń dla maksymalizacji wyników.',
    icon: Zap,
    gradient: 'from-yellow-500 to-orange-600',
    benefits: ['Monitoring 24/7', 'Alerty o zmianach', 'Automatyczne sugestie'],
    stats: '99.9% dostępności'
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
              Galaxy Funkcji
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Napędzanych AI
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Odkryj wszechstronne możliwości naszej platformy AI. Każda funkcja została zaprojektowana, 
            aby przyspieszyć rozwój Twojego biznesu.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8 mb-16">
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
                      isSelected ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Kluczowe korzyści:</h4>
                        <ul className="space-y-2">
                          {feature.benefits.map((benefit, i) => (
                            <li key={i} className="flex items-start space-x-2 text-sm text-gray-600">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
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
                Wszystkie Funkcje w Jednej Platformie
              </h3>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Nie musisz wybierać między różnymi narzędziami. Nasza platforma AI łączy wszystkie potrzebne funkcje 
                w jednym, intuicyjnym interfejsie.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                  Rozpocznij Bezpłatnie
                </button>
                <button className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-2xl border border-white/30 hover:bg-white/30 transition-all duration-300">
                  Zobacz Wszystkie Funkcje
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