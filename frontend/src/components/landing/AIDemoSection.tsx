import React from 'react';
import { Play, Globe, Brain, Target, Zap, ArrowRight } from 'lucide-react';

interface AIDemoSectionProps {
  isVisible: boolean;
  onTryDemo: (url: string) => void;
}

/* Commented out demoSteps array to fix build
const demoSteps = [
  {
    id: 1,
    title: 'Strategia & Inteligencja',
    description: 'AI Strategista analizuje rynek, konkurencję i identyfikuje możliwości wzrostu dla Twojego biznesu',
    icon: Brain,
    duration: 3000,
    color: 'from-blue-500 to-purple-600',
    result: 'Znalazł 3 nowe możliwości wzrostu i przeanalizował 15 konkurentów'
  },
  {
    id: 2,
    title: 'Tworzenie Treści',
    description: 'AI Creator produkuje wysokiej jakości treści: posty, reklamy, landing page dopasowane do Twojej marki',
    icon: Target,
    duration: 2500,
    color: 'from-green-500 to-emerald-600',
    result: 'Stworzył 12 postów LinkedIn, 3 kampanie Facebook i landing page'
  },
  {
    id: 3,
    title: 'Automatyzacja & Wykonanie',
    description: 'Inteligentne workflow\'y ustawiają publikowanie, zarządzanie kampaniami i optymalizację w czasie rzeczywistym',
    icon: Zap,
    duration: 2000,
    color: 'from-orange-500 to-red-600',
    result: 'Skonfigurował 5 automatyzacji i 24/7 monitoring kampanii'
  },
  {
    id: 4,
    title: 'Koordynacja Zespołu AI',
    description: 'Wszyscy asystenci AI współpracują ze sobą, tworząc spójny plan działania i raportując postępy',
    icon: Globe,
    duration: 1500,
    color: 'from-purple-500 to-pink-600',
    result: 'Zespół AI przygotował kompleksowy plan wzrostu na Q4'
  }
];
End of commented out demoSteps array */

// const sampleResults = {
//   strategy: {
//     opportunities: [
//       'Niezagospodarowany segment młodych profesjonalistów (25-35 lat)',
//       'Możliwość wejścia na rynek niemiecki - mała konkurencja',
//       'Trend AI w branży - 67% firm planuje inwestycje w 2024'
//     ],
//     competitors: [
//       { name: 'Digital Pro Agency', gap: 'Brak AI w ofercie', opportunity: 'Pozycjonowanie jako lider AI' },
//       { name: 'TechGrow', gap: 'Słaba obecność social media', opportunity: 'Dominacja LinkedIn' }
//     ]
//   },
//   content: [
//     { type: 'Post LinkedIn', title: '"3 trendy AI, które zmienią Twoją branżę w 2024"', engagement: '+234% CTR' },
//     { type: 'Kampania Facebook', title: 'Targeting: młodzi profesjonaliści', conversion: '+156% konwersji' },
//     { type: 'Landing Page', title: 'Optymalizacja pod słowa kluczowe AI', seo: 'Ranking #1 Google' }
//   ],
//   automation: [
//     { name: 'Publikowanie LinkedIn', frequency: '2 posty dziennie', status: 'Aktywne' },
//     { name: 'Email nurturing', segments: '3 segmenty klientów', open_rate: '47% open rate' },
//     { name: 'Lead scoring', leads: '23 hot leads dziś', conversion: '+89% jakość leadów' }
//   ],
//   team_coordination: {
//     alex: 'Przygotowuje strategię wejścia na rynek niemiecki',
//     maya: 'Tworzy serię 20 postów o AI dla młodych profesjonalistów',
//     viktor: 'Optymalizuje kampanie pod nowe segmenty',
//     sophia: 'Koordynuje Q4 launch plan - wszystkie elementy gotowe za 3 dni'
//   }
// };

const AIDemoSection: React.FC<AIDemoSectionProps> = ({ isVisible, onTryDemo }) => {
  // const [demoState, setDemoState] = useState<'ready' | 'running' | 'completed'>('ready');
  // const [currentStep, setCurrentStep] = useState(0);
  // const [showResults, setShowResults] = useState(false);
  // const [demoUrl, setDemoUrl] = useState('example.com');

  // const startDemo = () => {
  //   setDemoState('running');
  //   setCurrentStep(0);
  //   setShowResults(false);
  //   runDemoSequence();
  // };

  // const runDemoSequence = async () => {
  //   for (let i = 0; i < demoSteps.length; i++) {
  //     setCurrentStep(i);
  //     await new Promise(resolve => setTimeout(resolve, demoSteps[i].duration));
  //   }
  //   setShowResults(true);
  //   setTimeout(() => {
  //     setDemoState('completed');
  //   }, 1000);
  // };

  // const resetDemo = () => {
  //   setDemoState('ready');
  //   setCurrentStep(0);
  //   setShowResults(false);
  // };

  return (
    <section 
      id="ai-demo" 
      data-section 
      className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-blue-900 py-16 text-white sm:py-20"
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

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section header */}
        <div 
          className={`text-center mb-16 transition-all duration-1000 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <h2 className="mb-6 text-3xl font-bold sm:text-4xl md:text-5xl">
            <span className="text-white">Zobacz Platformę </span>
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              w Akcji
            </span>
          </h2>
          <p className="mx-auto max-w-3xl text-base text-blue-100 sm:text-lg md:text-xl">
            3-minutowe demo pokazujące jak cały zespół AI pracuje dla Twojego biznesu w czasie rzeczywistym
          </p>
        </div>

        {/* Video Demo */}
        <div className="max-w-5xl mx-auto">
          <div 
            className={`transition-all duration-1000 transform ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
            style={{ transitionDelay: '0.2s' }}
          >
            {/* Video container */}
            <div className="relative bg-black/20 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
              {/* Video placeholder */}
              <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900">
                {/* Video overlay content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    {/* Play button */}
                    <button className="inline-flex items-center justify-center w-24 h-24 bg-blue-600 hover:bg-blue-700 rounded-full shadow-2xl transform hover:scale-110 transition-all duration-300 mb-6">
                      <Play className="w-10 h-10 text-white ml-1" />
                    </button>
                    
                    <h3 className="text-2xl font-bold text-white mb-3">
                      Zobacz AI Growth OS w Akcji
                    </h3>
                    <p className="text-blue-200 max-w-md mx-auto">
                      3-minutowe demo pokazujące jak 4 obszary platformy współpracują w czasie rzeczywistym
                    </p>
                  </div>
                </div>

                {/* Video thumbnail overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                
                {/* Corner badges */}
                <div className="absolute top-4 left-4">
                  <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    LIVE DEMO
                  </div>
                </div>
                
                <div className="absolute top-4 right-4">
                  <div className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                    3:24
                  </div>
                </div>

                {/* Bottom info bar */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-semibold text-lg">Kompletny AI Growth OS Demo</h4>
                        <p className="text-blue-200 text-sm">Strategia → Tworzenie → Automatyzacja → Koordynacja</p>
                      </div>
                      <div className="flex items-center space-x-2 text-blue-200 text-sm">
                        <Globe className="w-4 h-4" />
                        <span>example.com</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Video description */}
            <div className="mt-8 text-center">
              <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <Brain className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                  <h4 className="font-semibold text-white mb-2">Strategia AI</h4>
                  <p className="text-blue-200 text-sm">Analiza rynku i konkurencji</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <Target className="w-8 h-8 text-green-400 mx-auto mb-3" />
                  <h4 className="font-semibold text-white mb-2">Creator AI</h4>
                  <p className="text-blue-200 text-sm">Tworzenie treści i reklam</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <Zap className="w-8 h-8 text-orange-400 mx-auto mb-3" />
                  <h4 className="font-semibold text-white mb-2">Automatyzacja</h4>
                  <p className="text-blue-200 text-sm">Workflow i publikowanie</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <Globe className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                  <h4 className="font-semibold text-white mb-2">Koordynacja</h4>
                  <p className="text-blue-200 text-sm">Zarządzanie zespołem AI</p>
                </div>
              </div>
            </div>
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
            <h3 className="text-2xl font-bold mb-4">Gotowy na kompletny AI Growth OS?</h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              To co widziałeś to tylko próbka. Uruchom pełny AI Growth OS dla swojego biznesu - 4 obszary, dziesiątki funkcji, jeden system.
            </p>
            <button 
              onClick={() => onTryDemo('your-website.com')}
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              <Zap className="w-6 h-6" />
              <span>Uruchom AI Growth OS</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIDemoSection;
