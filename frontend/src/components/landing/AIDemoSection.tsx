import React, { useState, useEffect } from 'react';
import { Play, Globe, Brain, Target, TrendingUp, CheckCircle, ArrowRight, Zap } from 'lucide-react';

interface AIDemoSectionProps {
  isVisible: boolean;
  onTryDemo: (url: string) => void;
}

const demoSteps = [
  {
    id: 1,
    title: 'Skanowanie strony',
    description: 'AI analizuje strukturę, treść i metadane Twojej witryny',
    icon: Globe,
    duration: 2000,
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 2,
    title: 'Przetwarzanie AI',
    description: 'Algorytmy wyodrębniają kluczowe informacje biznesowe',
    icon: Brain,
    duration: 3000,
    color: 'from-purple-500 to-purple-600'
  },
  {
    id: 3,
    title: 'Analiza konkurencji',
    description: 'Identyfikacja i badanie głównych konkurentów w branży',
    icon: Target,
    duration: 2500,
    color: 'from-orange-500 to-red-600'
  },
  {
    id: 4,
    title: 'Generowanie wglądów',
    description: 'Tworzenie spersonalizowanych rekomendacji biznesowych',
    icon: TrendingUp,
    duration: 1500,
    color: 'from-green-500 to-green-600'
  }
];

const sampleResults = {
  businessProfile: {
    company: 'TechStart Solutions',
    target: 'Małe i średnie przedsiębiorstwa szukające cyfrowej transformacji',
    usp: 'Kompleksowe rozwiązania IT z 24/7 wsparciem technicznym',
    problems: 'Brak efektywnych systemów cyfrowych, przestarzałe procesy'
  },
  competitors: [
    { name: 'Digital Pro Agency', strength: 'Marketing cyfrowy', weakness: 'Brak wsparcia technicznego' },
    { name: 'IT Solutions Plus', strength: 'Doświadczenie', weakness: 'Wysokie ceny' },
    { name: 'TechGrow', strength: 'Innowacyjność', weakness: 'Mały zespół' }
  ],
  recommendations: [
    'Podkreśl przewagę 24/7 wsparcia w komunikacji marketingowej',
    'Rozwiń ofertę dla sektora e-commerce',
    'Wprowadź pakiety cenowe dla startupów'
  ]
};

const AIDemoSection: React.FC<AIDemoSectionProps> = ({ isVisible, onTryDemo }) => {
  const [demoState, setDemoState] = useState<'ready' | 'running' | 'completed'>('ready');
  const [currentStep, setCurrentStep] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [demoUrl, setDemoUrl] = useState('example.com');

  const startDemo = () => {
    setDemoState('running');
    setCurrentStep(0);
    setShowResults(false);
    runDemoSequence();
  };

  const runDemoSequence = async () => {
    for (let i = 0; i < demoSteps.length; i++) {
      setCurrentStep(i);
      await new Promise(resolve => setTimeout(resolve, demoSteps[i].duration));
    }
    setShowResults(true);
    setTimeout(() => {
      setDemoState('completed');
    }, 1000);
  };

  const resetDemo = () => {
    setDemoState('ready');
    setCurrentStep(0);
    setShowResults(false);
  };

  return (
    <section 
      id="ai-demo" 
      data-section 
      className="py-20 bg-gradient-to-br from-gray-900 to-blue-900 text-white relative overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full animate-float-particle"
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
        {/* Section header */}
        <div 
          className={`text-center mb-16 transition-all duration-1000 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-white">Zobacz </span>
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI w Akcji
            </span>
          </h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Doświadcz mocy sztucznej inteligencji na żywo. Zobacz, jak AI analizuje biznes w czasie rzeczywistym.
          </p>
        </div>

        {/* Demo interface */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Demo controls */}
          <div 
            className={`transition-all duration-1000 transform ${
              isVisible ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'
            }`}
            style={{ transitionDelay: '0.2s' }}
          >
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-4">Interaktywne Demo AI</h3>
                <p className="text-blue-100">
                  {demoState === 'ready' && 'Kliknij play, aby zobaczyć AI w akcji'}
                  {demoState === 'running' && 'AI analizuje przykładową stronę...'}
                  {demoState === 'completed' && 'Analiza zakończona! Zobacz wyniki.'}
                </p>
              </div>

              {/* URL input */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    value={demoUrl}
                    onChange={(e) => setDemoUrl(e.target.value)}
                    className="w-full px-6 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl text-white placeholder-blue-200 focus:outline-none focus:border-blue-400"
                    placeholder="Wprowadź URL do analizy demo"
                    disabled={demoState === 'running'}
                  />
                  <Globe className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-blue-300" />
                </div>
              </div>

              {/* Demo controls */}
              <div className="text-center space-y-4">
                {demoState === 'ready' && (
                  <button
                    onClick={startDemo}
                    className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                  >
                    <Play className="w-6 h-6" />
                    <span>Uruchom Demo AI</span>
                  </button>
                )}
                
                {demoState === 'running' && (
                  <div className="space-y-4">
                    <div className="inline-flex items-center space-x-2 px-8 py-4 bg-white/20 rounded-2xl">
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Trwa analiza...</span>
                    </div>
                  </div>
                )}

                {demoState === 'completed' && (
                  <div className="space-y-4">
                    <div className="inline-flex items-center space-x-2 px-8 py-4 bg-green-500/20 border border-green-400/30 rounded-2xl">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                      <span>Analiza zakończona!</span>
                    </div>
                    <div className="flex space-x-4 justify-center">
                      <button
                        onClick={resetDemo}
                        className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-medium rounded-xl transition-colors"
                      >
                        Powtórz Demo
                      </button>
                      <button
                        onClick={() => onTryDemo(demoUrl)}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                      >
                        Wypróbuj na Swojej Stronie
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Demo visualization */}
          <div 
            className={`transition-all duration-1000 transform ${
              isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
            }`}
            style={{ transitionDelay: '0.4s' }}
          >
            {/* Process steps */}
            <div className="space-y-6 mb-8">
              {demoSteps.map((step, index) => {
                const Icon = step.icon;
                const isActive = demoState === 'running' && index === currentStep;
                const isCompleted = demoState === 'running' && index < currentStep || demoState === 'completed';
                const isUpcoming = demoState === 'running' && index > currentStep;

                return (
                  <div 
                    key={step.id}
                    className={`flex items-center space-x-4 p-4 rounded-2xl border transition-all duration-500 ${
                      isActive 
                        ? 'bg-gradient-to-r ' + step.color + ' border-transparent shadow-lg scale-105' 
                        : isCompleted 
                          ? 'bg-green-500/20 border-green-400/30' 
                          : 'bg-white/10 border-white/20'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isActive || isCompleted ? 'bg-white/20' : 'bg-white/10'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      ) : (
                        <Icon className={`w-6 h-6 ${isActive ? 'text-white animate-pulse' : 'text-blue-300'}`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-semibold mb-1 ${isActive ? 'text-white' : 'text-blue-100'}`}>
                        {step.title}
                      </h4>
                      <p className={`text-sm ${isActive ? 'text-blue-100' : 'text-blue-200'}`}>
                        {step.description}
                      </p>
                    </div>
                    {isActive && (
                      <div className="flex-shrink-0">
                        <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Results preview */}
            {showResults && (
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 animate-slide-up">
                <h4 className="text-xl font-bold mb-4 text-center">Przykładowe Wyniki Analizy</h4>
                
                <div className="space-y-4 text-sm">
                  <div className="bg-white/10 rounded-2xl p-4">
                    <h5 className="font-semibold text-blue-300 mb-2">Profil Biznesowy</h5>
                    <p className="text-blue-100 mb-2">
                      <strong>Firma:</strong> {sampleResults.businessProfile.company}
                    </p>
                    <p className="text-blue-100 mb-2">
                      <strong>Grupa docelowa:</strong> {sampleResults.businessProfile.target}
                    </p>
                    <p className="text-blue-100">
                      <strong>USP:</strong> {sampleResults.businessProfile.usp}
                    </p>
                  </div>

                  <div className="bg-white/10 rounded-2xl p-4">
                    <h5 className="font-semibold text-purple-300 mb-2">Analiza Konkurencji</h5>
                    <div className="space-y-2">
                      {sampleResults.competitors.slice(0, 2).map((competitor, index) => (
                        <div key={index} className="text-blue-100 text-xs">
                          <strong>{competitor.name}:</strong> {competitor.strength}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-2xl p-4">
                    <h5 className="font-semibold text-green-300 mb-2">Rekomendacje</h5>
                    <div className="space-y-1">
                      {sampleResults.recommendations.slice(0, 2).map((rec, index) => (
                        <div key={index} className="flex items-start space-x-2 text-blue-100 text-xs">
                          <ArrowRight className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div 
          className={`text-center mt-16 transition-all duration-1000 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
          style={{ transitionDelay: '0.6s' }}
        >
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold mb-4">Gotowy na prawdziwą analizę?</h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              To co widziałeś to tylko próbka. Otrzymaj kompletną analizę swojego biznesu w 60 sekund.
            </p>
            <button 
              onClick={() => onTryDemo('your-website.com')}
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              <Zap className="w-6 h-6" />
              <span>Analizuj Swoją Stronę</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIDemoSection;