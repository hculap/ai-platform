import React, { useState } from 'react';
import { Brain, Target, TrendingUp, Globe, Zap, Search, FileText, Megaphone, Package } from 'lucide-react';

interface FeatureGalaxySectionProps {
  isVisible: boolean;
}

const tools = [
  {
    id: 1,
    title: 'Analiza Strony',
    description: 'AI analizuje Twoją stronę internetową i tworzy kompletny profil biznesowy na jej podstawie.',
    icon: Globe,
    gradient: 'from-blue-500 to-blue-600',
    cost: '20 kredytów',
    category: 'Analiza Biznesowa'
  },
  {
    id: 2,
    title: 'Wyszukiwanie Konkurencji',
    description: 'Znajdź 8-12 nowych konkurentów w Twojej branży wraz z analizą ich strategii.',
    icon: Search,
    gradient: 'from-green-500 to-green-600',
    cost: '15 kredytów',
    category: 'Analiza Biznesowa'
  },
  {
    id: 3,
    title: 'Wzbogacanie Konkurencji',
    description: 'Dogłębna analiza wybranych konkurentów - USP, strategie, pozycjonowanie.',
    icon: Target,
    gradient: 'from-purple-500 to-purple-600',
    cost: '10 kredytów',
    category: 'Analiza Biznesowa'
  },
  {
    id: 4,
    title: 'Generowanie Skryptów',
    description: 'Twórz kompletne skrypty do YouTube, TikTok, VSL, blogów i postów w mediach społecznościowych.',
    icon: FileText,
    gradient: 'from-orange-500 to-orange-600',
    cost: '30 kredytów',
    category: 'Tworzenie Treści'
  },
  {
    id: 5,
    title: 'Hooki do Skryptów',
    description: 'Generuj angażujące rozpoczęcia do treści, które przyciągną uwagę odbiorców.',
    icon: Zap,
    gradient: 'from-red-500 to-red-600',
    cost: '15 kredytów',
    category: 'Tworzenie Treści'
  },
  {
    id: 6,
    title: 'Analiza Stylu Pisania',
    description: 'Analizuj i klonuj style pisania dla spójności marki we wszystkich treściach.',
    icon: Brain,
    gradient: 'from-indigo-500 to-indigo-600',
    cost: '50 kredytów',
    category: 'Tworzenie Treści'
  },
  {
    id: 7,
    title: 'Strategia Kampanii',
    description: 'AI tworzy kompletne strategie kampanii marketingowych dopasowane do Twojego biznesu.',
    icon: TrendingUp,
    gradient: 'from-pink-500 to-pink-600',
    cost: '25 kredytów',
    category: 'Marketing & Reklama'
  },
  {
    id: 8,
    title: 'Nagłówki Reklamowe',
    description: 'Generuj множество wariantów nagłówków reklamowych dla różnych platform i formatów.',
    icon: Megaphone,
    gradient: 'from-cyan-500 to-cyan-600',
    cost: '20 kredytów',
    category: 'Marketing & Reklama'
  },
  {
    id: 9,
    title: 'Kompletne Kreacje',
    description: 'Twórz pełne kreacje reklamowe - nagłówki, teksty, briefs wizualne i CTA.',
    icon: Target,
    gradient: 'from-emerald-500 to-emerald-600',
    cost: '25 kredytów',
    category: 'Marketing & Reklama'
  },
  {
    id: 10,
    title: 'Katalog Ofert',
    description: 'AI generuje 3-8 nowych produktów/usług na podstawie analizy Twojego biznesu.',
    icon: Package,
    gradient: 'from-violet-500 to-violet-600',
    cost: '35 kredytów',
    category: 'Rozwój Produktów'
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
              10 Narzędzi AI
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Business Growth Toolkit
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Każde narzędzie to specjalistyczna funkcja AI, która zastępuje agencje marketingowe i drogie oprogramowanie.
            Płać tylko za to, czego używasz.
          </p>
        </div>

        {/* Tools grid */}
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-16 max-w-7xl mx-auto">
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            const isHovered = hoveredFeature === tool.id;
            const isSelected = selectedFeature === tool.id;
            
            return (
              <div
                key={tool.id}
                className={`relative group cursor-pointer transition-all duration-700 transform ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
                } ${isHovered || isSelected ? 'scale-105 z-20' : 'hover:scale-105'}`}
                style={{ transitionDelay: `${index * 0.1}s` }}
                onMouseEnter={() => setHoveredFeature(tool.id)}
                onMouseLeave={() => setHoveredFeature(null)}
                onClick={() => setSelectedFeature(isSelected ? null : tool.id)}
              >
                {/* Card */}
                <div className={`h-full bg-white/80 backdrop-blur-sm rounded-3xl p-8 border-2 transition-all duration-500 ${
                  isHovered || isSelected 
                    ? 'border-transparent shadow-2xl' 
                    : 'border-white/50 shadow-lg hover:shadow-xl'
                } relative overflow-hidden`}>
                  
                  {/* Gradient overlay when hovered/selected */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 transition-opacity duration-500 ${
                    isHovered || isSelected ? 'opacity-10' : ''
                  }`} />
                  
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-500 ${
                      isHovered || isSelected
                        ? `bg-gradient-to-br ${tool.gradient} shadow-lg scale-110`
                        : 'bg-gray-100 group-hover:bg-gradient-to-br group-hover:' + tool.gradient
                    }`}>
                      <Icon className={`w-8 h-8 transition-colors duration-500 ${
                        isHovered || isSelected ? 'text-white' : 'text-gray-600 group-hover:text-white'
                      }`} />
                    </div>

                    {/* Content */}
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-gray-800">
                        {tool.title}
                      </h3>
                      <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {tool.cost}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                      {tool.description}
                    </p>

                    {/* Category badge */}
                    <div className="inline-flex items-center px-3 py-1 bg-gray-100/80 rounded-full text-xs font-medium text-gray-700 mb-4">
                      {tool.category}
                    </div>

                    {/* Hover indicator */}
                    <div className="flex items-center justify-center mt-3">
                      <div className={`text-xs font-medium transition-colors ${
                        isHovered ? 'text-blue-600' : 'text-gray-400'
                      }`}>
                        Dostępne w platformie
                      </div>
                    </div>
                  </div>

                  {/* Hover glow effect */}
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${tool.gradient} opacity-0 transition-opacity duration-500 blur-xl ${
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
                10 Narzędzi AI = Kompletny Marketing Toolkit
              </h3>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Zamiast płacić agencjom i kupować drogie oprogramowanie, użyj specjalistycznych narzędzi AI
                za ułamek kosztu tradycyjnych rozwiązań.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                  Uruchom Business Toolkit
                </button>
                <button className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-2xl border border-white/30 hover:bg-white/30 transition-all duration-300">
                  Zobacz Wszystkie Narzędzia
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